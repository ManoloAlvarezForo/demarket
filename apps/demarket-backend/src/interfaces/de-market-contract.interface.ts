// src/interfaces/DeMarketContract.ts
import { ethers } from 'ethers';

export interface DeMarketContract extends ethers.Contract {
  listItem: ethers.ContractMethod<
    [string, ethers.BigNumberish, ethers.BigNumberish],
    ethers.ContractTransaction
  >;
  itemCount: ethers.ContractMethod<[], ethers.BigNumberish>;
  items: ethers.ContractMethod<
    [number],
    {
      seller: string;
      token: string;
      price: ethers.BigNumberish;
      quantity: ethers.BigNumberish;
    }
  >;
}
