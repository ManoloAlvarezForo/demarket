import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';
import { RawItem } from 'src/items/types/item.type';

@Injectable()
export class TransactionsService {
  constructor(private blockchainService: BlockchainService) {}

  /**
   * Transfiere tokens de forma segura conectando el contrato a un firmante específico.
   *
   * @param contract - Instancia del contrato ERC-20.
   * @param signer - Firmante (wallet) que se conectará.
   * @param recipient - Dirección del destinatario.
   * @param amount - Cantidad de tokens a transferir (en unidades base).
   * @returns La respuesta de la transacción.
   */
  async safeTransfer(
    contract: ethers.Contract,
    signer: ethers.Signer,
    recipient: string,
    amount: bigint,
  ): Promise<ethers.TransactionResponse> {
    // Conecta el contrato con el firmante proporcionado
    const connectedContract = contract.connect(signer) as unknown as {
      transfer: (
        recipient: string,
        amount: bigint,
      ) => Promise<ethers.TransactionResponse>;
    };

    // Llama a la función transfer con tipado explícito
    const tx = await connectedContract.transfer(recipient, amount);
    return tx;
  }

  /**
   * Permite comprar un ítem llamando a la función purchaseItem del contrato DeMarket.
   *
   * @param itemId - El ID del ítem a comprar.
   * @param quantity - La cantidad a comprar, expresada como cadena (por ejemplo, "5" para 5 tokens).
   * @returns El hash de la transacción.
   */
  async purchaseItem(itemId: number, quantity: string): Promise<string> {
    try {
      console.log('purchaseItem called');

      // Validar que la cantidad sea un número válido.
      if (isNaN(Number(quantity))) {
        throw new Error('Invalid quantity provided');
      }

      // Obtener la instancia del contrato DeMarket y los datos del ítem.
      const deMarketContract = this.blockchainService.getDeMarketContract();
      const item = (await deMarketContract.items(itemId)) as RawItem;
      if (!item || !item.seller) {
        throw new Error('Item not found or missing seller data');
      }

      const signer = this.blockchainService.getSigner();
      const tokenContract = this.blockchainService.getTokenContract(item.token);

      // Para la llamada al contrato DeMarket (marketplace), usamos la cantidad como un entero.
      const marketplaceQuantity = BigInt(quantity);
      // Para las funciones del token (ERC20), convertimos a unidades base (18 decimales).
      const tokenQuantity = ethers.parseUnits(String(quantity), 18);

      const signerAddress = await signer.getAddress();
      const sellerBalance = (await tokenContract.balanceOf(
        item.seller,
      )) as bigint;
      if (sellerBalance < tokenQuantity) {
        throw new Error('Seller does not have enough tokens');
      }
      if (!signer) {
        throw new Error('Signer not found');
      }

      // Obtener la dirección del contrato DeMarket (spender)
      const spenderAddress =
        typeof deMarketContract.target === 'string'
          ? deMarketContract.target
          : 'address' in deMarketContract.target &&
              typeof deMarketContract.target.address === 'string'
            ? deMarketContract.target.address
            : (() => {
                throw new Error('Invalid target address');
              })();

      // Verificar el allowance del token (en unidades base)
      const allowanceAmount = (await tokenContract.allowance(
        signerAddress,
        spenderAddress,
      )) as bigint;
      if (allowanceAmount < tokenQuantity) {
        console.log('Insufficient allowance, calling approve...');
        try {
          const txApprove = (await tokenContract.approve(
            spenderAddress,
            tokenQuantity,
          )) as ethers.TransactionResponse;
          await txApprove.wait();
        } catch (error) {
          console.error('Approval transaction failed:', error);
          throw new Error('Approval failed');
        }
      } else {
        console.log('Sufficient allowance, skipping approve.');
      }

      const provider = this.blockchainService.getProvider();
      const contractAddress = this.blockchainService.getContractAddress();

      // Calcular totalPrice: item.price es en wei y marketplaceQuantity es un número entero.
      // Por ejemplo, si item.price es 1e18 y marketplaceQuantity es 5, totalPrice = 5e18.
      const totalPrice = BigInt(item.price) * marketplaceQuantity;

      // Estimar el gas para la llamada.
      const estimatedGas = await provider.estimateGas({
        to: contractAddress,
        data: deMarketContract.interface.encodeFunctionData('purchaseItem', [
          itemId,
          marketplaceQuantity,
        ]),
        value: totalPrice,
      });
      console.log('Item price:', item.price);
      console.log('Quantity (tokens):', marketplaceQuantity.toString());
      console.log('Total price (in Wei):', totalPrice.toString());
      console.log('Estimated gas:', estimatedGas.toString());

      const buyerBalance = await provider.getBalance(signerAddress);
      const totalCost = totalPrice + BigInt(estimatedGas);
      console.log('Buyer balance:', buyerBalance.toString());
      console.log('Total cost (price + gas):', totalCost.toString());
      if (buyerBalance < totalCost) {
        throw new Error('Insufficient funds to complete the purchase');
      }

      console.log('Calling purchaseItem...');
      const txPurchase = (await deMarketContract.purchaseItem(
        itemId,
        marketplaceQuantity, // Aquí usamos el número entero (ej. 10n)
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

  /**
   * Retira los fondos ganados por el vendedor del marketplace.
   *
   * @returns Un objeto que contiene el hash de la transacción y la cantidad retirada (formateada en ETH).
   */
  async withdrawFunds(): Promise<{
    txHash?: string;
    amountWithdrawn?: string;
    error?: string;
  }> {
    try {
      const deMarketContract = this.blockchainService.getDeMarketContract();
      // Obtener el balance del vendedor almacenado en el contrato
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

      // Buscar y decodificar el evento FundsWithdrawn para obtener la cantidad retirada
      const fundsWithdrawnEvent = receipt?.logs.find(
        (log) => log.topics[0] === ethers.id('FundsWithdrawn(address,uint256)'),
      );
      let amountWithdrawn = '0';
      if (fundsWithdrawnEvent) {
        const decoded =
          deMarketContract.interface.parseLog(fundsWithdrawnEvent);
        amountWithdrawn = ethers.formatUnits(
          decoded?.args[1] as ethers.BigNumberish,
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

export default TransactionsService;
