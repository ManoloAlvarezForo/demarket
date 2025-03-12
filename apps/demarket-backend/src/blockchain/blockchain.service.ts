import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { DeMarketContract } from '../interfaces/de-market-contract.interface';
import { DeMarketABI } from '../interfaces/DeMarketABI';
import { ERC20Contract } from '../interfaces/erc20-contract.interface';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)', // Added function
  'function decimals() view returns (uint8)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
];

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private deMarketContract: DeMarketContract;
  private contractAddress: string;

  constructor(private configService: ConfigService) {
    // Get current environment (LOCAL, SEPOLIA, MAINNET, etc.)
    const env = this.configService
      .get<string>('NODE_ENV', 'local')
      .toUpperCase();

    // Retrieve environment variables according to the environment
    const rpcUrl = this.configService.get<string>(`${env}_RPC_URL`);
    let privateKey = this.configService.get<string>(`${env}_PRIVATE_KEY`) || '';
    const contractAddress = this.configService.get<string>(
      `${env}_DEMARKET_CONTRACT_ADDRESS`,
    );

    // Validate that the required variables are defined
    if (!rpcUrl || !contractAddress) {
      throw new Error(`Missing configuration for environment: ${env}`);
    }

    // Validate that privateKey is provided in non-local environments
    if (!privateKey && env !== 'LOCAL') {
      throw new Error(`Missing private key for environment: ${env}`);
    }

    // Configure the provider
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `Failed to connect to provider: ${rpcUrl}, ${err.message}`,
      );
    }

    // For local environment, generate a random wallet if no private key is provided
    if (!privateKey && env === 'LOCAL') {
      console.warn(
        'No private key found, generating a random wallet for local use.',
      );
      privateKey = ethers.Wallet.createRandom().privateKey;
    }

    // Create wallet instance
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = contractAddress;

    // Initialize the DeMarket contract instance using the contract address, ABI, and wallet as signer
    this.deMarketContract = new ethers.Contract(
      contractAddress,
      DeMarketABI,
      this.wallet,
    ) as DeMarketContract;
  }

  // Method to get the provider
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  // Method to get the DeMarket contract instance
  getDeMarketContract(): DeMarketContract {
    return this.deMarketContract;
  }

  // Method to get the contract address
  getContractAddress(): string {
    return this.contractAddress;
  }

  // Method to get the wallet (signer)
  getSigner(): ethers.Wallet {
    return this.wallet;
  }

  // Method to get a token contract instance for a given token address
  getTokenContract(tokenAddress: string): ERC20Contract {
    return new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.wallet,
    ) as ERC20Contract;
  }
}

export default BlockchainService;
