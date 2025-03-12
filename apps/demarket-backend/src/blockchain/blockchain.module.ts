import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

/**
 * @module BlockchainModule
 * @description Provides and exports the BlockchainService for use in other modules.
 */
@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
