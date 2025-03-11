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

  @Post('list')
  async listItem(@Body() listItemDto: ListItemDto): Promise<{
    transactionHash: string;
    itemId: string;
    seller: string;
    token: string;
    price: string;
    quantity: string;
  }> {
    try {
      const { tokenAddress, price, quantity } = listItemDto;
      return await this.itemsService.listItem(tokenAddress, price, quantity);
    } catch (error: unknown) {
      const err = error as Error;
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error al listar el ítem',
          message: err.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getItems(): Promise<Item[]> {
    try {
      return await this.itemsService.getItems();
    } catch (error) {
      const err = error as Error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener los ítems',
          message: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
