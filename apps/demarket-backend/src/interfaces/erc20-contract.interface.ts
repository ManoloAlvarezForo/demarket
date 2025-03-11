import { ethers } from 'ethers';

export interface ERC20Contract extends ethers.Contract {
  balanceOf: ethers.ContractMethod<[owner: string], bigint>;
  approve: ethers.ContractMethod<[spender: string, amount: bigint], boolean>;
  allowance: ethers.ContractMethod<[owner: string, spender: string], bigint>;
  decimals: ethers.ContractMethod<[], number>;
  transfer: ethers.ContractMethod<[recipient: string, amount: bigint], boolean>;
}
