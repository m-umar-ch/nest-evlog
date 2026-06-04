import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { initLogger } from 'evlog';
import { AppModule } from './app.module';

initLogger({
  env: { service: 'nest-evlog-worker' },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
}
bootstrap();
