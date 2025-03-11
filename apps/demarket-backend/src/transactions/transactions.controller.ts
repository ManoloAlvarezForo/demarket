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
    console.log('Received purchase request:', { itemId, quantity }); // Log para verificar la solicitud
    const transactionHash = await this.transactionsService.purchaseItem(
      itemId,
      quantity,
    );
    return { transactionHash };
  }

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
