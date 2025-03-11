// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3001', // URL de tu frontend (Next.js)
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });
  await app.listen(3000); // Puerto del backend
}
void bootstrap();
