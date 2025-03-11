import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';

type Item = {
  seller: string;
  token: string;
  price: bigint;
  quantity: bigint;
};

@Injectable()
export class TransactionsService {
  constructor(private blockchainService: BlockchainService) {}

  async safeTransfer(
    contract: ethers.Contract,
    signer: ethers.Signer,
    recipient: string,
    amount: bigint,
  ): Promise<ethers.TransactionResponse> {
    // Conectar el contrato al signer
    const connectedContract = contract.connect(signer) as unknown as {
      transfer: (
        recipient: string,
        amount: bigint,
      ) => Promise<ethers.TransactionResponse>;
    };

    // Llamar a la función transfer con el tipado explícito
    const tx = await connectedContract.transfer(recipient, amount);
    return tx;
  }

  async assignTokensIfNeeded(
    sellerAddress: string,
    tokenAddress: string,
  ): Promise<void> {
    try {
      console.log(`Assigning tokens to seller: ${sellerAddress}`);

      // Obtener el contrato del token
      const tokenContract =
        this.blockchainService.getTokenContract(tokenAddress);
      console.log('Token contract functions:', Object.keys(tokenContract));

      // Obtener el saldo del vendedor (bigint en ethers v6)
      const sellerBalance = (await tokenContract.balanceOf(
        sellerAddress,
      )) as bigint;

      console.log(
        `Seller balance before assignment: ${sellerBalance.toString()}`,
      );

      // Definir el saldo mínimo requerido (100 tokens, 18 decimales)
      const minimumBalance: bigint = ethers.parseUnits('100', 18);
      console.log(`Minimum balance required: ${minimumBalance.toString()}`);

      // Si el vendedor ya tiene suficiente balance, salimos
      if (sellerBalance >= minimumBalance) {
        console.log(
          `Seller already has sufficient balance: ${sellerBalance.toString()}`,
        );
        return;
      }

      // Calcular la cantidad de tokens a asignar
      const tokensToAdd: bigint = minimumBalance - sellerBalance;
      console.log(`Tokens to add: ${ethers.formatUnits(tokensToAdd, 18)}`);

      // Transferir tokens al vendedor usando el signer
      const signer = this.blockchainService.getSigner();
      const tx = await this.safeTransfer(
        tokenContract,
        signer,
        sellerAddress,
        tokensToAdd,
      );
      console.log(`Transfer transaction hash: ${tx.hash}`);

      // Esperar confirmación de la transacción
      await tx.wait();
      console.log(
        `Assigned ${ethers.formatUnits(tokensToAdd, 18)} tokens to seller: ${sellerAddress}`,
      );

      // Verificar el saldo después de la asignación
      const newSellerBalance = (await tokenContract.balanceOf(
        sellerAddress,
      )) as bigint;
      console.log(
        `Seller balance after assignment: ${newSellerBalance.toString()}`,
      );
    } catch (error) {
      console.error('Error assigning tokens if needed:', error);
      throw error;
    }
  }

  async purchaseItem(itemId: number, quantity: string): Promise<string> {
    try {
      console.log('purchaseItem called');

      // Validación de la cantidad
      if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
        throw new Error('Invalid quantity provided');
      }

      // Obtención del contrato del mercado
      const deMarketContract = this.blockchainService.getDeMarketContract();
      const item = (await deMarketContract.items(itemId)) as Item;

      // Verificación de la existencia del artículo y su vendedor
      if (!item || !item.seller) {
        throw new Error('Item not found or missing seller data');
      }

      // Asignar tokens al vendedor si es necesario
      await this.assignTokensIfNeeded(item.seller, item.token);

      const signer = this.blockchainService.getSigner();
      const tokenContract = this.blockchainService.getTokenContract(item.token);
      const decimals = Number(await tokenContract.decimals());
      const quantityWei = ethers.parseUnits(quantity, decimals);

      // Obtención de la dirección del firmante
      const signerAddress = await signer.getAddress();
      const sellerBalance = (await tokenContract.balanceOf(
        item.seller,
      )) as bigint;

      if (sellerBalance < quantityWei) {
        throw new Error('Seller does not have enough tokens');
      }

      if (!signer) {
        throw new Error('Signer not found');
      }

      // Obtención de la dirección del gasto (spender)
      const spenderAddress =
        typeof deMarketContract.target === 'string'
          ? deMarketContract.target
          : 'address' in deMarketContract.target &&
              typeof deMarketContract.target.address === 'string'
            ? deMarketContract.target.address
            : (() => {
                throw new Error('Invalid target address');
              })();

      // Verificación de la asignación (allowance)
      const allowanceAmount = (await tokenContract.allowance(
        signerAddress,
        spenderAddress,
      )) as bigint;

      // Si no hay suficiente allowance, aprobamos el gasto
      if (allowanceAmount < quantityWei) {
        console.log('Insufficient allowance, calling approve...');
        try {
          const txApprove = (await tokenContract.approve(
            spenderAddress,
            quantityWei,
          )) as ethers.TransactionResponse;
          await txApprove.wait();
        } catch (error) {
          console.error('Approval transaction failed:', error);
          throw new Error('Approval failed');
        }
      } else {
        console.log('Sufficient allowance, skipping approve.');
      }

      // Llamada para realizar la compra
      console.log('Calling purchaseItem...');

      const totalPrice = BigInt(item.price) * BigInt(quantityWei);

      try {
        const txPurchase = (await deMarketContract.purchaseItem(
          itemId,
          quantityWei,
          {
            value: totalPrice,
          },
        )) as ethers.TransactionResponse;

        await txPurchase.wait();
        console.log(`Transaction successful: ${txPurchase.hash}`);
        return txPurchase.hash;
      } catch (error) {
        console.error('Purchase transaction failed:', error);
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error; // Lanza el error original en lugar de un error genérico
    }
  }

  async simulatePurchase(itemId: number, quantity: string): Promise<string> {
    try {
      console.log('Simulating purchase...');

      // Obtener el contrato del mercado
      const deMarketContract = this.blockchainService.getDeMarketContract();

      // Simular un ítem para pruebas
      const mockItem = {
        seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Cuenta #1 como vendedor
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Dirección del contrato ERC20Mock
        price: ethers.parseEther('1.0').toString(), // Precio en wei (1 ETH = 1e18 wei)
        quantity: ethers.parseUnits('100', 18).toString(), // Cantidad en tokens
      };

      // Usar el ítem simulado
      const item = mockItem;

      if (!item || !item.seller) {
        throw new Error('Item not found or missing seller data');
      }

      await this.assignTokensIfNeeded(item.seller, item.token);
      const signer = this.blockchainService.getSigner();
      const tokenContract = this.blockchainService.getTokenContract(item.token);
      const decimals = Number(await tokenContract.decimals());

      // Convertir la cantidad a wei (entero)
      const quantityWei = ethers.parseUnits(quantity, decimals);

      const signerAddress = await signer.getAddress();

      // Verificar que el vendedor tenga suficientes tokens
      const sellerBalance = (await tokenContract.balanceOf(
        item.seller,
      )) as bigint;
      console.log('Seller balance:', sellerBalance.toString());
      console.log('Quantity in wei:', quantityWei.toString());

      if (sellerBalance < quantityWei) {
        throw new Error('Seller does not have enough tokens');
      }

      // Aprobar la transacción si es necesario
      const spenderAddress =
        typeof deMarketContract.target === 'string'
          ? deMarketContract.target
          : 'address' in deMarketContract.target &&
              typeof deMarketContract.target.address === 'string'
            ? deMarketContract.target.address
            : (() => {
                throw new Error('Invalid target address');
              })();

      const allowanceAmount = (await tokenContract.allowance(
        signerAddress,
        spenderAddress,
      )) as bigint;

      console.log('Allowance amount:', allowanceAmount.toString());

      if (allowanceAmount < quantityWei) {
        console.log('Insufficient allowance, calling approve...');
        const txApprove = (await tokenContract.approve(
          spenderAddress,
          quantityWei,
        )) as ethers.TransactionResponse;
        await txApprove.wait();
      } else {
        console.log('Sufficient allowance, skipping approve.');
      }

      // Realizar la compra
      console.log('Calling purchaseItem...');

      // Convertir el precio a wei (ya está en wei, pero lo parseamos para asegurarnos)
      const priceWei = ethers.parseEther(item.price.toString());

      // Calcular el totalPrice (priceWei * quantityWei)
      const totalPrice = priceWei * quantityWei;

      const txPurchase = (await deMarketContract.purchaseItem(
        itemId,
        quantityWei,
        {
          value: totalPrice, // Envía ETH al contrato
        },
      )) as ethers.TransactionResponse;

      await txPurchase.wait();
      console.log(`Transaction successful: ${txPurchase.hash}`);
      return txPurchase.hash;
    } catch (error) {
      console.error('Error simulating purchase:', error);
      throw error;
    }
  }

  async withdrawFunds(): Promise<string> {
    try {
      const deMarketContract = this.blockchainService.getDeMarketContract();
      const tx =
        (await deMarketContract.withdrawFunds()) as ethers.TransactionResponse;
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Withdraw transaction failed:', error);
      throw new Error('Withdraw failed');
    }
  }
}
