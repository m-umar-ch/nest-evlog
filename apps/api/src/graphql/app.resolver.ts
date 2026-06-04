import { Query, Resolver } from '@nestjs/graphql';
import { useLogger } from 'evlog/nestjs';
import { Health } from './models/health.model';

@Resolver()
export class AppResolver {
  @Query(() => Health, { name: 'health' })
  health(): Health {
    useLogger().set({ graphql: { operation: 'health' } });
    return { status: 'ok' };
  }
}
