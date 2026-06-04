import { Args, Query, Resolver } from '@nestjs/graphql';
import { useLogger } from 'evlog/nestjs';
import { User } from '../graphql/models/user.model';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => String }) id: string): User {
    useLogger().set({ graphql: { operation: 'user', userId: id } });
    return this.usersService.findById(id) as User;
  }
}
