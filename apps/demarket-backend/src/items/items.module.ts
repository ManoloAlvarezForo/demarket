import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

/**
 * @module ItemsModule
 * @description This module handles the business logic for items in the marketplace.
 * It imports the BlockchainModule to access blockchain functionality, and registers the
 * ItemsController and ItemsService.
 */
@Module({
  imports: [BlockchainModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
