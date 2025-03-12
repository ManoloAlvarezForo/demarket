import { ethers } from 'ethers';

/**
 * @interface DeMarketContract
 * @description This interface extends ethers.Contract to provide strongly typed methods
 * for interacting with the DeMarket marketplace contract.
 */
export interface DeMarketContract extends ethers.Contract {
  /**
   * @notice Lists an item for sale.
   * @param token - The address of the ERC-20 token being listed.
   * @param name - The name of the item.
   * @param price - The price per token (in Wei).
   * @param quantity - The number of tokens to list (in token's base units).
   * @returns A ContractTransaction representing the transaction.
   */
  listItem: ethers.ContractMethod<
    [string, string, ethers.BigNumberish, ethers.BigNumberish],
    ethers.ContractTransaction
  >;

  /**
   * @notice Retrieves the total number of items listed in the marketplace.
   * @returns The item count as a BigNumberish value.
   */
  itemCount: ethers.ContractMethod<[], ethers.BigNumberish>;

  /**
   * @notice Retrieves the details of a listed item.
   * @param id - The identifier of the item.
   * @returns An object containing the seller's address, token address, item name, price (in Wei),
   * and available quantity (in token base units).
   */
  items: ethers.ContractMethod<
    [number],
    {
      seller: string;
      token: string;
      name: string;
      price: ethers.BigNumberish;
      quantity: ethers.BigNumberish;
    }
  >;
}
