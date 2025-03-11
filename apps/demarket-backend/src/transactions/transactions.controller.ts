import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('purchase')
  async purchaseItem(
    @Body('itemId') itemId: number,
    @Body('quantity') quantity: string,
  ): Promise<{ transactionHash: string }> {
    const transactionHash = await this.transactionsService.purchaseItem(
      itemId,
      quantity,
    );
    return { transactionHash };
  }

  @Post('simulate-purchase')
  async simulatePurchase(
    @Body('itemId') itemId: number,
    @Body('quantity') quantity: string,
  ): Promise<{ transactionHash: string }> {
    const transactionHash = await this.transactionsService.simulatePurchase(
      itemId,
      quantity,
    );
    return { transactionHash };
  }

  @Post('withdraw')
  async withdrawFunds(): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      const transactionHash = await this.transactionsService.withdrawFunds();
      return { success: true, txHash: transactionHash };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
}
