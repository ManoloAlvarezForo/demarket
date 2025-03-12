import { IsEthereumAddress, IsString, Matches } from 'class-validator';

export class SellOrderData {
  @IsEthereumAddress()
  seller: string;

  @IsEthereumAddress()
  token: string; // Matches the frontend

  @IsEthereumAddress()
  buyerAddress: string;

  @IsString()
  sellerSignature: string;

  @IsString()
  @Matches(/^\d+$/, {
    message: 'Amount must be an integer in wei (e.g., 1000000000000000000)',
  })
  amount: string;

  @IsString()
  @Matches(/^\d+$/, {
    message: 'Price must be an integer in wei (e.g., 1000000000000000000)',
  })
  price: string;
}
