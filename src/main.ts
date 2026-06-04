import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { initLogger } from 'evlog';
import { AppModule } from './app.module';
import { EvlogExceptionFilter } from './common/filters/evlog-exception.filter';

initLogger({
  env: { service: 'nest-evlog' },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new EvlogExceptionFilter());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
