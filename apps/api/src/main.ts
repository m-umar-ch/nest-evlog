import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { initLogger } from 'evlog';
import { AppModule } from './app.module';
import { EvlogGraphqlExceptionFilter } from './common/filters/evlog-graphql-exception.filter';

initLogger({
  env: { service: 'nest-evlog-api' },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new EvlogGraphqlExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
