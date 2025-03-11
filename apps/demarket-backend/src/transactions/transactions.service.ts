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

  async purchaseItem(itemId: number, quantity: string): Promise<string> {
    try {
      console.log('purchaseItem called');

      // Validación de la cantidad
      if (isNaN(Number(quantity))) {
        throw new Error('Invalid quantity provided');
      }

      // Obtención del contrato de mercado
      const deMarketContract = this.blockchainService.getDeMarketContract();
      const item = (await deMarketContract.items(itemId)) as Item;

      // Verificación de la existencia del artículo y su vendedor
      if (!item || !item.seller) {
        throw new Error('Item not found or missing seller data');
      }

      const signer = this.blockchainService.getSigner();
      const tokenContract = this.blockchainService.getTokenContract(item.token);

      // Convertir la cantidad ingresada a BigInt (como número entero de tokens)
      const quantityTokens = BigInt(quantity); // Por ejemplo, "1" se convierte en 1n

      // Obtención de la dirección del firmante
      const signerAddress = await signer.getAddress();
      const sellerBalance = (await tokenContract.balanceOf(
        item.seller,
      )) as bigint;

      if (sellerBalance < quantityTokens) {
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
      if (allowanceAmount < quantityTokens) {
        console.log('Insufficient allowance, calling approve...');
        try {
          const txApprove = (await tokenContract.approve(
            spenderAddress,
            quantityTokens,
          )) as ethers.TransactionResponse;
          await txApprove.wait();
        } catch (error) {
          console.error('Approval transaction failed:', error);
          throw new Error('Approval failed');
        }
      } else {
        console.log('Sufficient allowance, skipping approve.');
      }

      // Estimar el gas usando el provider
      const provider = this.blockchainService.getProvider();
      const contractAddress = this.blockchainService.getContractAddress();

      // Calcular el precio total: item.price ya está en Wei y se multiplica por la cantidad entera
      const totalPrice = BigInt(item.price) * quantityTokens;
      const estimatedGas = await provider.estimateGas({
        to: contractAddress,
        data: deMarketContract.interface.encodeFunctionData('purchaseItem', [
          itemId,
          quantityTokens,
        ]),
        value: totalPrice,
      });

      // Depuración: Imprimir detalles importantes
      console.log('Item price:', item.price);
      console.log('Quantity (tokens):', quantityTokens.toString());
      console.log('Total price (in Wei):', totalPrice.toString());
      console.log('Estimated gas:', estimatedGas.toString());

      // Verificar el saldo del comprador
      const buyerBalance = await provider.getBalance(signerAddress);
      const totalCost = totalPrice + estimatedGas;

      console.log('Buyer balance:', buyerBalance.toString());
      console.log('Total cost (price + gas):', totalCost.toString());

      if (buyerBalance < totalCost) {
        throw new Error('Insufficient funds to complete the purchase');
      }

      // Realizar la llamada al método purchaseItem del contrato
      console.log('Calling purchaseItem...');
      const txPurchase = (await deMarketContract.purchaseItem(
        itemId,
        quantityTokens,
        { value: totalPrice, gasLimit: estimatedGas },
      )) as ethers.TransactionResponse;

      await txPurchase.wait();
      console.log(`Transaction successful: ${txPurchase.hash}`);
      return txPurchase.hash;
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  async withdrawFunds(): Promise<{
    txHash?: string;
    amountWithdrawn?: string;
    error?: string;
  }> {
    try {
      const deMarketContract = this.blockchainService.getDeMarketContract();

      const sellerBalance = (await deMarketContract.balances(
        this.blockchainService.getSigner().address,
      )) as bigint;

      if (sellerBalance === 0n) {
        console.error('No funds available to withdraw');
        return { error: 'No funds available to withdraw' };
      }

      const tx =
        (await deMarketContract.withdrawFunds()) as ethers.TransactionResponse;
      const receipt = await tx.wait();

      const fundsWithdrawnEvent = receipt?.logs.find(
        (log) => log.topics[0] === ethers.id('FundsWithdrawn(address,uint256)'),
      );
      let amountWithdrawn = '0';
      if (fundsWithdrawnEvent) {
        const decoded =
          deMarketContract.interface.parseLog(fundsWithdrawnEvent);
        amountWithdrawn = ethers.formatUnits(
          decoded!.args[1] as ethers.BigNumberish,
          18,
        );
      }

      return { txHash: tx.hash, amountWithdrawn };
    } catch (error) {
      console.error('Withdraw transaction failed:', error);
      throw new Error('Withdraw failed');
    }
  }
}
