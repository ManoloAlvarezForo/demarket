import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { ListItemDto } from './dto/list-item.dto';
import { Item } from './types/item.type';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /**
   * @notice Endpoint to list a new item for sale.
   * @param listItemDto - Data Transfer Object containing tokenAddress, name, price, and quantity.
   * @returns An object with transaction hash, item details, and listing confirmation.
   */
  @Post('list')
  async listItem(@Body() listItemDto: ListItemDto): Promise<{
    transactionHash: string;
    itemId: string;
    seller: string;
    token: string;
    name: string;
    price: string;
    quantity: string;
  }> {
    try {
      // Destructure the DTO to extract tokenAddress, name, price, and quantity.
      const { tokenAddress, name, price, quantity } = listItemDto;
      // Call the itemsService to list the item on the blockchain.
      return await this.itemsService.listItem(
        tokenAddress,
        name,
        price,
        quantity,
      );
    } catch (error: unknown) {
      // If an error occurs, cast it to Error and throw an HttpException with BAD_REQUEST status.
      const err = error as Error;
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error listing the item',
          message: err.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * @notice Endpoint to retrieve all listed items.
   * @returns An array of items with their details (id, seller, token, name, price, and quantity).
   */
  @Get()
  async getItems(): Promise<Item[]> {
    try {
      // Call the itemsService to fetch all items from the blockchain.
      return await this.itemsService.getItems();
    } catch (error) {
      // If an error occurs, cast it to Error and throw an HttpException with INTERNAL_SERVER_ERROR status.
      const err = error as Error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error retrieving items',
          message: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
