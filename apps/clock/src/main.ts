import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { initLogger } from 'evlog';
import { AppModule } from './app.module';
import { EvlogExceptionFilter } from './common/filters/evlog-exception.filter';

initLogger({
  env: { service: 'nest-evlog-clock' },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new EvlogExceptionFilter());
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
}
bootstrap();
