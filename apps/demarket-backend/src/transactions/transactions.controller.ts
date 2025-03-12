import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

/**
 * @controller TransactionsController
 * @description Handles transaction-related endpoints such as purchasing items and withdrawing funds.
 */
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * @endpoint POST /transactions/purchase
   * @description Endpoint to purchase an item. Expects itemId and quantity in the request body.
   * @param itemId - The ID of the item to purchase.
   * @param quantity - The quantity of tokens to purchase (as a string).
   * @returns An object containing the transaction hash.
   */
  @Post('purchase')
  async purchaseItem(
    @Body('itemId') itemId: number,
    @Body('quantity') quantity: string,
  ): Promise<{ transactionHash: string }> {
    console.log('Received purchase request:', { itemId, quantity });
    const transactionHash = await this.transactionsService.purchaseItem(
      itemId,
      quantity,
    );
    return { transactionHash };
  }

  /**
   * @endpoint POST /transactions/withdraw
   * @description Endpoint to withdraw funds earned by the seller.
   * @returns An object indicating success, and if successful, includes the transaction hash and amount withdrawn.
   */
  @Post('withdraw')
  async withdrawFunds(): Promise<{
    success: boolean;
    txHash?: string;
    amountWithdrawn?: string;
    error?: string;
  }> {
    try {
      console.log('Received withdraw request');
      const { txHash, amountWithdrawn } =
        await this.transactionsService.withdrawFunds();
      return { success: true, txHash, amountWithdrawn };
    } catch (error) {
      const err = error as Error;
      console.error('Withdraw failed:', err.message);
      return { success: false, error: err.message };
    }
  }
}
