// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module'; // Importar ItemsModule
import { TransactionsModule } from './transactions/transactions.module'; // Importar TransactionsModule

const defaultConfig = {
  NODE_ENV: 'local',
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [() => defaultConfig],
    }),
    ItemsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
