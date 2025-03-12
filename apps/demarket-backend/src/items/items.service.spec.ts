import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';
import { RawItem, ItemListedEvent } from './types/item.type';

// Definition of a dummy network type for ethers v6
type NetworkType = { chainId: number; name: string };

// Create a mock provider that includes getNetwork, getBalance, and estimateGas (which returns a BigInt)
const mockProvider: {
  getNetwork: () => Promise<NetworkType>;
  getBalance: (address: string) => Promise<bigint>;
  estimateGas: (tx: any) => Promise<bigint>;
} = {
  getNetwork: jest.fn().mockResolvedValue({ chainId: 31337, name: 'hardhat' }),
  getBalance: jest.fn().mockResolvedValue(ethers.parseEther('10000')), // Dummy balance: 10000 ETH
  estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
};

// Update the mock for BlockchainService to include all required functions
const mockBlockchainService: Partial<BlockchainService> = {
  getDeMarketContract: jest.fn(),
  getSigner: jest.fn(),
  getTokenContract: jest.fn(),
  getProvider: jest.fn().mockReturnValue(mockProvider),
  getContractAddress: jest.fn().mockReturnValue('0xMarketAddress'),
};

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: BlockchainService, useValue: mockBlockchainService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    jest.clearAllMocks();
    // Set the default return value for getDeMarketContract
    (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue({
      listItem: jest.fn(),
      itemCount: jest.fn(),
      items: jest.fn(),
      interface: { parseLog: jest.fn() },
    });
  });

  describe('listItem', () => {
    it('should list an item for sale and return correct details', async () => {
      // Mock item data: price of 1 ETH (in wei) and quantity of 10 tokens (in base units)
      const mockItem: ItemListedEvent = {
        itemId: BigInt(1),
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        name: 'Test Item',
        price: ethers.parseEther('1.0'),
        quantity: ethers.parseEther('10'),
      };

      // Create a fake transaction response with a receipt that contains logs
      const txResponse = {
        hash: '0xTransactionHash',
        wait: jest.fn().mockResolvedValue({
          logs: [
            // Simulate a log that, when parsed, returns our ItemListed event
            { dummy: 'data' },
          ],
        }),
      };

      // Setup the mock for listItem function of the contract to return our txResponse
      const mockDeMarketContract = {
        listItem: jest.fn().mockResolvedValue(txResponse),
        interface: {
          parseLog: jest.fn().mockReturnValue({
            name: 'ItemListed',
            args: mockItem,
          }),
        },
      };

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      // Call listItem on the service
      const tokenAddress = '0xTokenAddress';
      const name = 'Test Item';
      const price = '1.0';
      const quantity = '10';

      const result = await service.listItem(
        tokenAddress,
        name,
        price,
        quantity,
      );

      // Verify that the contract's listItem function was called with correct parameters
      expect(mockDeMarketContract.listItem).toHaveBeenCalledWith(
        tokenAddress,
        name,
        ethers.parseEther(price),
        ethers.parseEther(quantity),
      );

      // Verify that the result is correctly parsed
      expect(result).toEqual({
        transactionHash: txResponse.hash,
        itemId: '1',
        seller: mockItem.seller,
        token: mockItem.token,
        name: mockItem.name,
        price: ethers.formatEther(mockItem.price),
        quantity: ethers.formatEther(mockItem.quantity),
      });
    });

    it('should throw an error if the transaction receipt is missing', async () => {
      // Simulate a transaction response whose wait returns null
      const txResponse = {
        hash: '0xTransactionHash',
        wait: jest.fn().mockResolvedValue(null),
      };
      const mockDeMarketContract = {
        listItem: jest.fn().mockResolvedValue(txResponse),
        interface: { parseLog: jest.fn() },
      };
      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      await expect(
        service.listItem('0xTokenAddress', 'Test Item', '1.0', '10'),
      ).rejects.toThrow('Transaction was not mined correctly');
    });

    it('should throw an error if the ItemListed event is not found', async () => {
      const txResponse = {
        hash: '0xTransactionHash',
        wait: jest.fn().mockResolvedValue({ logs: [] }),
      };
      const mockDeMarketContract = {
        listItem: jest.fn().mockResolvedValue(txResponse),
        interface: { parseLog: jest.fn() },
      };
      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      await expect(
        service.listItem('0xTokenAddress', 'Test Item', '1.0', '10'),
      ).rejects.toThrow('ItemListed event not found');
    });
  });

  describe('getItems', () => {
    it('should return an array of items', async () => {
      // Simulate that itemCount is 2
      const mockDeMarketContract = {
        itemCount: jest.fn().mockResolvedValue(2),
        items: jest.fn(),
      };

      // Create two mock items
      const rawItem1: RawItem = {
        seller: '0xSellerAddress1',
        token: '0xTokenAddress1',
        name: 'Item 1',
        price: ethers.parseEther('1.0'),
        quantity: ethers.parseEther('10'),
      };
      const rawItem2: RawItem = {
        seller: '0xSellerAddress2',
        token: '0xTokenAddress2',
        name: 'Item 2',
        price: ethers.parseEther('2.0'),
        quantity: ethers.parseEther('20'),
      };

      // Setup items method to return rawItem1 for index 1 and rawItem2 for index 2
      mockDeMarketContract.items
        .mockResolvedValueOnce(rawItem1)
        .mockResolvedValueOnce(rawItem2);

      (mockBlockchainService.getDeMarketContract as jest.Mock).mockReturnValue(
        mockDeMarketContract,
      );

      const items = await service.getItems();
      expect(items).toEqual([
        {
          id: 1,
          seller: rawItem1.seller,
          token: rawItem1.token,
          name: rawItem1.name,
          price: ethers.formatEther(rawItem1.price),
          quantity: ethers.formatEther(rawItem1.quantity),
        },
        {
          id: 2,
          seller: rawItem2.seller,
          token: rawItem2.token,
          name: rawItem2.name,
          price: ethers.formatEther(rawItem2.price),
          quantity: ethers.formatEther(rawItem2.quantity),
        },
      ]);
    });
  });
});
