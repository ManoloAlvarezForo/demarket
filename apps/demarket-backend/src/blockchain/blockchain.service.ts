import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { DeMarketContract } from '../interfaces/de-market-contract.interface';
import { DeMarketABI } from '../interfaces/DeMarketABI';
import { ERC20Contract } from '../interfaces/erc20-contract.interface';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)', // Función agregada
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
    // Obtener el entorno actual (local, sepolia, mainnet)
    const env = this.configService
      .get<string>('NODE_ENV', 'local')
      .toUpperCase();

    // Obtener las variables de entorno según el entorno
    const rpcUrl = this.configService.get<string>(`${env}_RPC_URL`);
    let privateKey = this.configService.get<string>(`${env}_PRIVATE_KEY`) || '';
    const contractAddress = this.configService.get<string>(
      `${env}_DEMARKET_CONTRACT_ADDRESS`,
    );

    // Validar que las variables estén definidas
    if (!rpcUrl || !contractAddress) {
      throw new Error(`Missing configuration for environment: ${env}`);
    }

    // Configurar el provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Si no hay privateKey en local, generar una billetera de prueba
    if (!privateKey && env === 'LOCAL') {
      console.warn(
        'No private key found, generating a random wallet for local use.',
      );
      privateKey = ethers.Wallet.createRandom().privateKey;
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = contractAddress;
    // Configurar el contrato
    this.deMarketContract = new ethers.Contract(
      contractAddress,
      DeMarketABI,
      this.wallet,
    ) as DeMarketContract; // Usar la interfaz
  }

  // Método para obtener el provider
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getDeMarketContract(): DeMarketContract {
    return this.deMarketContract;
  }

  getContractAddress(): string {
    return this.contractAddress; // Puedes acceder a la dirección del contrato aquí
  }

  getSigner(): ethers.Wallet {
    return this.wallet;
  }

  getTokenContract(tokenAddress: string): ERC20Contract {
    return new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.wallet,
    ) as ERC20Contract;
  }
}
