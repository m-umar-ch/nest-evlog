import { Controller, Get, Param } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    useLogger().set({ route: 'users.findOne' });
    return this.usersService.findById(id);
  }
}
