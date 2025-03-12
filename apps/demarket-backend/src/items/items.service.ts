import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Item, ItemListedEvent, RawItem } from './types/item.type';
import { ethers } from 'ethers';

@Injectable()
export class ItemsService {
  constructor(private blockchainService: BlockchainService) {}

  /**
   * Lists an item for sale on the marketplace.
   * @param tokenAddress - The address of the ERC-20 token being listed.
   * @param name - The name of the item.
   * @param price - The price of the item in ETH (as a string).
   * @param quantity - The quantity of tokens being listed (as a string).
   * @returns An object containing transaction details and item information.
   */
  async listItem(
    tokenAddress: string,
    name: string, // New parameter for the name
    price: string,
    quantity: string,
  ): Promise<{
    transactionHash: string;
    itemId: string;
    seller: string;
    token: string;
    name: string;
    price: string;
    quantity: string;
  }> {
    const deMarketContract = this.blockchainService.getDeMarketContract();
    // Call the contract, passing the name as well
    const tx = (await deMarketContract.listItem(
      tokenAddress,
      name,
      ethers.parseEther(price),
      ethers.parseEther(quantity),
    )) as ethers.ContractTransactionResponse;

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction was not mined correctly');
    }

    // Find the ItemListed event
    const event = receipt.logs
      .map((log) => {
        try {
          return deMarketContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsedLog) => parsedLog?.name === 'ItemListed');

    if (!event) {
      throw new Error('ItemListed event not found');
    }

    // Destructure the event arguments, including the new "name" field
    const {
      itemId,
      seller,
      token,
      name: itemName,
      price: priceWei,
      quantity: quantityWei,
    } = event.args as unknown as ItemListedEvent;

    // Convert values to manageable types
    const itemIdStr = itemId.toString();
    const priceStr = ethers.formatEther(priceWei); // Convert from Wei to ETH
    const quantityStr = ethers.formatEther(quantityWei); // Convert from Wei to tokens

    return {
      transactionHash: tx.hash,
      itemId: itemIdStr,
      seller,
      token,
      name: itemName,
      price: priceStr,
      quantity: quantityStr,
    };
  }

  /**
   * Retrieves all listed items from the marketplace.
   * @returns An array of items with their details.
   */
  async getItems(): Promise<Item[]> {
    const deMarketContract = this.blockchainService.getDeMarketContract();
    const itemCount = (await deMarketContract.itemCount()) as number;
    const items: Item[] = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = (await deMarketContract.items(i)) as RawItem;
      items.push({
        id: i,
        seller: item.seller,
        token: item.token,
        name: item.name, // Include the name in the returned object
        price: ethers.formatEther(item.price),
        quantity: ethers.formatEther(item.quantity),
      });
    }

    return items;
  }
}
