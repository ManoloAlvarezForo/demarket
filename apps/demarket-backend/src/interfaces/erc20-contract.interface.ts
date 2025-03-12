import { ethers } from 'ethers';

/**
 * @interface ERC20Contract
 * @description This interface extends ethers.Contract to provide strongly typed methods for interacting with standard ERC-20 tokens.
 */
export interface ERC20Contract extends ethers.Contract {
  /**
   * Retrieves the token balance of a given address.
   * @param owner - The address whose balance will be queried.
   * @returns The balance as a bigint, representing the amount in the smallest unit (e.g., Wei).
   */
  balanceOf: ethers.ContractMethod<[owner: string], bigint>;

  /**
   * Approves a spender to withdraw a specific amount of tokens from the caller's account.
   * @param spender - The address which will be allowed to spend tokens.
   * @param amount - The number of tokens to allow (in the token's smallest unit).
   * @returns A boolean indicating whether the operation was successful.
   */
  approve: ethers.ContractMethod<[spender: string, amount: bigint], boolean>;

  /**
   * Returns the remaining amount of tokens that a spender is allowed to spend on behalf of an owner.
   * @param owner - The address owning the tokens.
   * @param spender - The address that is approved to spend the tokens.
   * @returns The remaining allowance as a bigint.
   */
  allowance: ethers.ContractMethod<[owner: string, spender: string], bigint>;

  /**
   * Retrieves the number of decimals used by the token.
   * @returns The number of decimals (typically 18 for most ERC-20 tokens).
   */
  decimals: ethers.ContractMethod<[], number>;

  /**
   * Transfers tokens from the caller's account to a specified recipient.
   * @param recipient - The address of the recipient.
   * @param amount - The number of tokens to transfer (in the smallest unit).
   * @returns A boolean indicating whether the transfer was successful.
   */
  transfer: ethers.ContractMethod<[recipient: string, amount: bigint], boolean>;
}
