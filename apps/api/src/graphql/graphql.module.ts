import './enums/order-status.enum';
import './enums/user-plan.enum';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, '..', 'schema.gql'),
      sortSchema: true,
      graphiql: true,
    }),
  ],
  providers: [AppResolver],
})
export class GraphqlModule {}
