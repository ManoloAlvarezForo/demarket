import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Item, RawItem } from './types/item.type';
import { ethers } from 'ethers';

type ItemListedEvent = {
  itemId: bigint; // uint256
  seller: string; // address
  token: string; // address
  price: bigint; // uint256
  quantity: bigint; // uint256
};

@Injectable()
export class ItemsService {
  constructor(private blockchainService: BlockchainService) {}

  async listItem(
    tokenAddress: string,
    price: string,
    quantity: string,
  ): Promise<{
    transactionHash: string;
    itemId: string;
    seller: string;
    token: string;
    price: string;
    quantity: string;
  }> {
    const deMarketContract = this.blockchainService.getDeMarketContract();
    const tx = (await deMarketContract.listItem(
      tokenAddress,
      ethers.parseEther(price),
      ethers.parseEther(quantity),
    )) as ethers.ContractTransactionResponse;

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('La transacción no se minó correctamente');
    }

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
      throw new Error('Evento ItemListed no encontrado');
    }

    const {
      itemId,
      seller,
      token,
      price: priceWei,
      quantity: quantityWei,
    } = event.args as unknown as ItemListedEvent;

    // Convertir los valores a tipos más manejables
    const itemIdStr = itemId.toString();
    const priceStr = ethers.formatEther(priceWei); // Convierte de wei a ETH
    const quantityStr = ethers.formatEther(quantityWei); // Convierte de wei a tokens

    return {
      transactionHash: tx.hash,
      itemId: itemIdStr,
      seller,
      token,
      price: priceStr,
      quantity: quantityStr,
    };
  }

  async getItems(): Promise<Item[]> {
    const deMarketContract = this.blockchainService.getDeMarketContract();
    const itemCount = (await deMarketContract.itemCount()) as number;
    const items: Item[] = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = (await deMarketContract.items(i)) as RawItem;
      console.log('quantity ', item.quantity);
      items.push({
        id: i,
        seller: item.seller,
        token: item.token,
        price: ethers.formatEther(item.price),
        quantity: ethers.formatEther(item.quantity),
      });
    }

    return items;
  }
}
