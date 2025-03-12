import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): { message: string; appName: string; version: string } {
    const appName = this.configService.get<string>('APP_NAME') || 'DeMarket';
    const version = this.configService.get<string>('APP_VERSION') || '1.0.0';
    return {
      message: 'Welcome to the DeMarket API!',
      appName,
      version,
    };
  }
}
