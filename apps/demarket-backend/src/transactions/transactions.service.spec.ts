import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';

// Definition of a dummy network type for ethers v6
type NetworkType = { chainId: number; name: string };

// We create a mock provider that includes getNetwork, getBalance, and estimateGas (which returns a BigInt)
const mockProvider: {
  getNetwork: () => Promise<NetworkType>;
  getBalance: (address: string) => Promise<bigint>;
  estimateGas: (tx: any) => Promise<bigint>;
} = {
  getNetwork: jest.fn().mockResolvedValue({ chainId: 31337, name: 'hardhat' }),
  getBalance: jest.fn().mockResolvedValue(ethers.parseEther('10000')), // Dummy balance: 10000 ETH
  estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
};

// We update the mock for BlockchainService to include all required functions
const mockBlockchainService: Partial<BlockchainService> = {
  getDeMarketContract: jest.fn(),
  getSigner: jest.fn(),
  getTokenContract: jest.fn(),
  getProvider: jest.fn().mockReturnValue(mockProvider),
  getContractAddress: jest.fn().mockReturnValue('0xMarketAddress'),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: BlockchainService, useValue: mockBlockchainService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('purchaseItem', () => {
    it('should successfully purchase an item', async () => {
      // Mock item data: price of 1 ETH (in wei) and quantity of 10 tokens (in base units)
      const mockItem = {
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        price: ethers.parseEther('1.0').toString(), // "1000000000000000000"
        quantity: ethers.parseEther('10').toString(), // "10000000000000000000"
        name: 'Test Item',
      };

      // Mock signer (buyer)
      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue('0xBuyerAddress'),
      };

      // Mock the ERC20 contract with its required functions
      const mockTokenContract = {
        decimals: jest.fn().mockResolvedValue(18),
        balanceOf: jest.fn().mockResolvedValue(ethers.parseEther('100')),
        allowance: jest.fn().mockResolvedValue(ethers.parseUnits('0', 18)),
        approve: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      // Mock the DeMarket contract with the required functions and the "target" property
      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(mockItem),
        target: '0xMarketAddress',
        purchaseItem: jest.fn().mockResolvedValue({
          hash: '0xTransactionHash',
          wait: jest.fn().mockResolvedValue(true),
        }),
        interface: {
          encodeFunctionData: jest.fn().mockReturnValue('0xEncodedData'),
        },
      };

      // Configure the BlockchainService mocks
      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );
      (mockBlockchainService.getSigner as jest.Mock).mockReturnValue(
        mockSigner,
      );
      (mockBlockchainService.getTokenContract as jest.Mock).mockReturnValue(
        mockTokenContract,
      );

      const purchaseQuantity = '5'; // The buyer wants to purchase 5 tokens

      // For the contract call, we use the quantity as an integer:
      // (e.g., BigInt("5") gives 5n)
      // For token functions, we use the quantity in base units (18 decimals):
      // ethers.parseUnits("5", 18) -> 5000000000000000000n
      const expectedTokenQuantity = ethers.parseUnits(purchaseQuantity, 18);

      // Calculate totalPrice: totalPrice = item.price * marketplaceQuantity
      // If the price is 1e18 and 5 tokens are purchased, totalPrice = 5e18.
      // (Using the integer value of purchaseQuantity: BigInt("5") == 5n)
      // const totalPrice = BigInt(mockItem.price) * marketplaceQuantity;

      // Execute the purchaseItem function
      const result = await service.purchaseItem(1, purchaseQuantity);
      expect(result).toBe('0xTransactionHash');
      expect(mockDeMarketContract.items).toHaveBeenCalledWith(1);
      // We expect that approve is called with expectedTokenQuantity (5000000000000000000n)
      expect(mockTokenContract.approve).toHaveBeenCalledWith(
        '0xMarketAddress',
        expectedTokenQuantity,
      );
      // We expect that purchaseItem is called with the integer quantity (5n)
      expect(mockTokenContract.approve).toHaveBeenCalledWith(
        '0xMarketAddress',
        BigInt(5) * 10n ** 18n,
      );
    });

    it('should throw an error if the item is not found', async () => {
      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(null),
        target: '0xMarketAddress',
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );
      await expect(service.purchaseItem(1, '10')).rejects.toThrow(
        'Item not found or missing seller data',
      );
    });

    it('should throw an error if the seller does not have enough tokens', async () => {
      const mockItem = {
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        price: ethers.parseEther('1.0').toString(),
        quantity: ethers.parseEther('10').toString(),
        name: 'Test Item',
      };

      // We simulate that the seller's balance is insufficient
      const mockTokenContract = {
        decimals: jest.fn().mockResolvedValue(18),
        balanceOf: jest.fn().mockResolvedValue(BigInt(0)),
        allowance: jest.fn().mockResolvedValue(ethers.parseUnits('0', 18)),
        approve: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(mockItem),
        target: '0xMarketAddress',
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );
      (mockBlockchainService.getTokenContract as jest.Mock).mockReturnValue(
        mockTokenContract,
      );

      await expect(service.purchaseItem(1, '10')).rejects.toThrow(
        'Seller does not have enough tokens',
      );
    });
  });

  describe('withdrawFunds', () => {
    it('should successfully withdraw funds', async () => {
      const mockDeMarketContract = {
        balances: jest.fn().mockResolvedValue(ethers.parseEther('5')),
        withdrawFunds: jest.fn().mockResolvedValue({
          hash: '0xWithdrawHash',
          wait: jest.fn().mockResolvedValue({
            logs: [
              {
                topics: [ethers.id('FundsWithdrawn(address,uint256)')],
              },
            ],
          }),
        }),
        interface: {
          parseLog: jest.fn().mockReturnValue({
            args: ['0xSellerAddress', ethers.parseEther('5')],
          }),
        },
        target: '0xMarketAddress',
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      const result = await service.withdrawFunds();
      expect(result).toMatchObject({
        txHash: '0xWithdrawHash',
        amountWithdrawn: ethers.formatEther(ethers.parseEther('5')),
        success: true,
      });
      expect(mockDeMarketContract.withdrawFunds).toHaveBeenCalled();
    });

    it('should throw an error if the withdraw transaction fails', async () => {
      const mockDeMarketContract = {
        withdrawFunds: jest
          .fn()
          .mockRejectedValue(new Error('Withdraw failed')),
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );
      await expect(service.withdrawFunds()).rejects.toThrow('Withdraw failed');
    });
  });

  describe('authorizeItem', () => {
    it('should authorize an item using an EIP-712 signature', async () => {
      const price = ethers.parseEther('1.0');
      const quantity = ethers.parseEther('10');
      const name = 'Test Item';

      const mockItem = {
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        price: price.toString(),
        quantity: quantity.toString(),
        name,
      };

      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(mockItem),
        target: '0xMarketAddress',
        nonces: jest.fn().mockResolvedValue(BigInt(0)),
        authorizeItem: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      const signature = '0xDummySignature';

      await expect(
        mockDeMarketContract.authorizeItem(1, quantity.toString(), signature),
      ).resolves.toBeDefined();
    });
  });
});
