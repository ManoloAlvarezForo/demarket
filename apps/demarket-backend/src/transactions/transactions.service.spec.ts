import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';

const mockBlockchainService = {
  getDeMarketContract: jest.fn(),
  getSigner: jest.fn(),
  getTokenContract: jest.fn(),
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
      // Mock de los métodos del contrato
      const mockItem = {
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        price: ethers.parseEther('1.0').toString(),
        quantity: ethers.parseUnits('10', 18).toString(),
      };

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue('0xBuyerAddress'),
      };

      const mockTokenContract = {
        decimals: jest.fn().mockResolvedValue(18),
        balanceOf: jest.fn().mockResolvedValue(ethers.parseUnits('100', 18)),
        allowance: jest.fn().mockResolvedValue(ethers.parseUnits('0', 18)),
        approve: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(mockItem),
        target: '0xMarketAddress',
        purchaseItem: jest.fn().mockResolvedValue({
          hash: '0xTransactionHash',
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      // Configurar los mocks
      mockBlockchainService.getDeMarketContract.mockReturnValue(
        mockDeMarketContract,
      );
      mockBlockchainService.getSigner.mockReturnValue(mockSigner);
      mockBlockchainService.getTokenContract.mockReturnValue(mockTokenContract);

      // Ejecutar la función
      const result = await service.purchaseItem(1, '10');

      // Verificar el resultado
      expect(result).toBe('0xTransactionHash');
      expect(mockDeMarketContract.items).toHaveBeenCalledWith(1);
      expect(mockTokenContract.approve).toHaveBeenCalledWith(
        '0xMarketAddress',
        ethers.parseUnits('10', 18),
      );
      expect(mockDeMarketContract.purchaseItem).toHaveBeenCalledWith(
        1,
        ethers.parseUnits('10', 18),
        {
          value: BigInt(mockItem.price) * BigInt(ethers.parseUnits('10', 18)),
        },
      );
    });

    it('should throw an error if the item is not found', async () => {
      // Mock de los métodos del contrato
      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(null),
      };

      mockBlockchainService.getDeMarketContract.mockReturnValue(
        mockDeMarketContract,
      );

      // Ejecutar la función y verificar que lance un error
      await expect(service.purchaseItem(1, '10')).rejects.toThrow(
        'Item not found or missing seller data',
      );
    });

    it('should throw an error if the seller does not have enough tokens', async () => {
      // Mock de los métodos del contrato
      const mockItem = {
        seller: '0xSellerAddress',
        token: '0xTokenAddress',
        price: ethers.parseEther('1.0').toString(),
        quantity: ethers.parseUnits('10', 18).toString(),
      };

      const mockTokenContract = {
        decimals: jest.fn().mockResolvedValue(18),
        balanceOf: jest.fn().mockResolvedValue(ethers.parseUnits('5', 18)), // Menos de lo necesario
      };

      const mockDeMarketContract = {
        items: jest.fn().mockResolvedValue(mockItem),
      };

      mockBlockchainService.getDeMarketContract.mockReturnValue(
        mockDeMarketContract,
      );
      mockBlockchainService.getTokenContract.mockReturnValue(mockTokenContract);

      // Ejecutar la función y verificar que lance un error
      await expect(service.purchaseItem(1, '10')).rejects.toThrow(
        'Seller does not have enough tokens',
      );
    });
  });

  describe('withdrawFunds', () => {
    it('should successfully withdraw funds', async () => {
      // Mock de los métodos del contrato
      const mockDeMarketContract = {
        withdrawFunds: jest.fn().mockResolvedValue({
          hash: '0xWithdrawHash',
          wait: jest.fn().mockResolvedValue(true),
        }),
      };

      mockBlockchainService.getDeMarketContract.mockReturnValue(
        mockDeMarketContract,
      );

      // Ejecutar la función
      const result = await service.withdrawFunds();

      // Verificar el resultado
      expect(result).toBe('0xWithdrawHash');
      expect(mockDeMarketContract.withdrawFunds).toHaveBeenCalled();
    });

    it('should throw an error if the withdraw transaction fails', async () => {
      // Mock de los métodos del contrato
      const mockDeMarketContract = {
        withdrawFunds: jest
          .fn()
          .mockRejectedValue(new Error('Withdraw failed')),
      };

      mockBlockchainService.getDeMarketContract.mockReturnValue(
        mockDeMarketContract,
      );

      // Ejecutar la función y verificar que lance un error
      await expect(service.withdrawFunds()).rejects.toThrow('Withdraw failed');
    });
  });
});
