import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

/**
 * @module TransactionsModule
 * @description This module imports the BlockchainModule and registers the TransactionsController
 * and TransactionsService. It handles all operations related to transactions, such as purchasing items
 * and withdrawing funds.
 */
@Module({
  imports: [BlockchainModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
