import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';
import { RawItem } from 'src/items/types/item.type';
import { SellOrderData } from './dto/sell.dto';
import { ERC20Contract } from '../interfaces/erc20-contract.interface';
import { DeMarketABI } from '../interfaces/DeMarketABI';

@Injectable()
export class TransactionsService {
  constructor(private blockchainService: BlockchainService) {}

  async processSellOrder(sellData: SellOrderData) {
    try {
      // Validate numeric fields
      if (isNaN(Number(sellData.amount))) {
        throw new Error('Invalid Amount');
      }
      if (isNaN(Number(sellData.price))) {
        throw new Error('Invalid Price');
      }
      console.log('[Backend] Received data:', sellData); // <--- Key log
      // 1. Verify only the seller's signature
      const isValidSeller = this.verifySignature(
        sellData,
        sellData.sellerSignature,
        sellData.seller,
      );

      console.log('Sale data:', sellData);
      console.log('Seller signature:', sellData.sellerSignature);
      console.log('Seller:', sellData.seller);
      console.log('Buyer:', sellData.buyerAddress);

      if (!isValidSeller) {
        throw new Error('Invalid seller signature');
      }

      // 2. Get contract instances
      const tokenContract = this.blockchainService.getTokenContract(
        sellData.token,
      );
      const signer = this.blockchainService.getSigner();

      // 3. Verify seller's balance
      const sellerBalance = (await tokenContract.balanceOf(
        sellData.seller,
      )) as bigint;
      const requiredAmount = BigInt(sellData.amount);

      if (sellerBalance < requiredAmount) {
        throw new Error('Insufficient seller balance');
      }

      // 4. Execute transfer
      await this.transferTokens(
        tokenContract,
        signer,
        sellData.seller,
        sellData.buyerAddress, // Use buyerAddress
        requiredAmount,
      );

      return {
        txHash: 'Transaction successful',
        details: `${sellData.amount} tokens transferred from ${sellData.seller} to ${sellData.buyerAddress}`,
      };
    } catch (error) {
      const err = error as Error;
      console.error('Error processing sell order:', err);
      throw new Error(`Error processing order: ${err.message}`);
    }
  }

  // transactions.service.ts (Backend)
  private verifySignature(
    orderData: SellOrderData,
    signature: string,
    expectedSigner: string,
  ): boolean {
    // A. Get chainId and contractAddress from the domain SYNCHRONOUSLY
    const chainId = 31337; // Hardcoded for development (must match the frontend!)

    const domain = {
      name: 'DeMarket',
      version: '1',
      chainId: chainId, // Must return 31337
      verifyingContract: this.blockchainService.getContractAddress(), // Must return 0x9fE467...
    };

    // B. EXACT structure of EIP-712 types
    const types = {
      SellOrder: [
        { name: 'seller', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'buyer', type: 'address' }, // <-- buyer (not buyerAddress)
      ],
    };

    // C. Correct mapping of buyerAddress to buyer
    const message = {
      seller: orderData.seller,
      token: orderData.token,
      amount: orderData.amount,
      price: orderData.price,
      buyer: orderData.buyerAddress,
    };

    console.log('[Backend] Message to verify:', message);

    try {
      const recoveredAddress = ethers.verifyTypedData(
        domain,
        types,
        message,
        signature,
      );
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch (error) {
      const err = error as Error;
      console.error('Error verifying signature:', err);
      return false;
    }
  }

  async transferTokens(
    tokenContract: ERC20Contract,
    signer: ethers.Signer,
    from: string,
    to: string,
    amount: bigint,
  ): Promise<void> {
    try {
      const marketplaceAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

      // Verify allowance
      const allowance = (await tokenContract.allowance(
        from,
        marketplaceAddress,
      )) as bigint;
      console.log('[DEBUG] Allowance:', allowance.toString());

      if (allowance < amount) {
        throw new Error(
          `Insufficient allowance: ${allowance.toString()} < ${amount.toString()}`,
        );
      }

      // Create Marketplace contract instance with full ABI
      const marketplaceContract = new ethers.Contract(
        marketplaceAddress,
        DeMarketABI, // Ensure it includes executeTransfer
        signer,
      );

      // Execute contract function
      const tx = (await marketplaceContract.executeTransfer(
        tokenContract.target,
        from,
        to,
        amount,
      )) as ethers.TransactionResponse;

      const receipt = await tx.wait();
      console.log(
        '[SUCCESS] Transaction mined in block:',
        receipt?.blockNumber,
      );
    } catch (error) {
      const err = error as Error;
      console.error('[ERROR] Full details:', {
        rawError: err,
        from,
        to,
        amount: amount.toString(),
        tokenAddress: tokenContract.target,
        signerAddress: await signer.getAddress(),
      });
      throw new Error(`Transfer failed: ${(error as Error).message}`);
    }
  }

  /**
   * Securely transfers tokens by connecting the contract to a specific signer.
   *
   * @param contract - ERC-20 contract instance.
   * @param signer - Signer (wallet) that will connect.
   * @param recipient - Recipient's address.
   * @param amount - Amount of tokens to transfer (in base units).
   * @returns The transaction response.
   */
  async safeTransfer(
    contract: ethers.Contract,
    signer: ethers.Signer,
    recipient: string,
    amount: bigint,
  ): Promise<ethers.TransactionResponse> {
    // Connects the contract with the provided signer
    const connectedContract = contract.connect(signer) as unknown as {
      transfer: (
        recipient: string,
        amount: bigint,
      ) => Promise<ethers.TransactionResponse>;
    };

    // Calls the transfer function with explicit typing
    const tx = await connectedContract.transfer(recipient, amount);
    return tx;
  }

  /**
   * Allows purchasing an item by calling the purchaseItem function of the DeMarket contract.
   *
   * @param itemId - The ID of the item to purchase.
   * @param quantity - The amount to purchase, expressed as a string (e.g., "5" for 5 tokens).
   * @returns The transaction hash.
   */
  async purchaseItem(itemId: number, quantity: string): Promise<string> {
    try {
      console.log('purchaseItem called');

      // Validate that the quantity is a valid number.
      if (isNaN(Number(quantity))) {
        throw new Error('Invalid quantity provided');
      }

      // Get the DeMarket contract instance and item data.
      const deMarketContract = this.blockchainService.getDeMarketContract();
      const item = (await deMarketContract.items(itemId)) as RawItem;
      if (!item || !item.seller) {
        throw new Error('Item not found or missing seller data');
      }

      const signer = this.blockchainService.getSigner();
      const tokenContract = this.blockchainService.getTokenContract(item.token);

      const marketplaceQuantity = BigInt(quantity);
      // For token (ERC20) functions, convert to base units (18 decimals).
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

      // Get the DeMarket contract address (spender)
      const spenderAddress =
        typeof deMarketContract.target === 'string'
          ? deMarketContract.target
          : 'address' in deMarketContract.target &&
              typeof deMarketContract.target.address === 'string'
            ? deMarketContract.target.address
            : (() => {
                throw new Error('Invalid target address');
              })();

      // Check token allowance (in base units)
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

      const totalPrice = BigInt(item.price) * marketplaceQuantity;

      // Estimate gas for the call.
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
        marketplaceQuantity,
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
   * Withdraws the funds earned by the seller from the marketplace.
   *
   * @returns An object containing the transaction hash and the withdrawn amount (formatted in ETH).
   */
  async withdrawFunds(): Promise<{
    success?: boolean;
    txHash?: string;
    amountWithdrawn?: string;
    error?: string;
  }> {
    try {
      const deMarketContract = this.blockchainService.getDeMarketContract();
      let success = true;
      // Get the seller's balance stored in the contract
      const sellerBalance = (await deMarketContract.balances(
        this.blockchainService.getSigner().address,
      )) as bigint;
      if (sellerBalance === 0n) {
        console.error('No funds available to withdraw');
        success = false;
        return { error: 'No funds available to withdraw', success };
      }
      const tx =
        (await deMarketContract.withdrawFunds()) as ethers.TransactionResponse;
      const receipt = await tx.wait();

      // Find and decode the FundsWithdrawn event to get the withdrawn amount
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

      return { txHash: tx.hash, amountWithdrawn, success };
    } catch (error) {
      console.error('Withdraw transaction failed:', error);
      throw new Error('Withdraw failed');
    }
  }
}

export default TransactionsService;
