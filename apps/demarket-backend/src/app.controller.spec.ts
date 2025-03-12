import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: 'APP_NAME' | 'APP_VERSION'): string => {
        const config: Record<'APP_NAME' | 'APP_VERSION', string> = {
          APP_NAME: 'DeMarket',
          APP_VERSION: '1.0.0',
        };
        return config[key];
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return an object with message, appName, and version', () => {
      expect(appController.getHello()).toEqual({
        message: 'Welcome to the DeMarket API!',
        appName: 'DeMarket',
        version: '1.0.0',
      });
    });
  });
});
