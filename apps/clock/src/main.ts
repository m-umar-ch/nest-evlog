import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { initLogger } from 'evlog';
import { AppModule } from './app.module';

initLogger({
  env: { service: 'nest-evlog-clock' },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
}
bootstrap();
