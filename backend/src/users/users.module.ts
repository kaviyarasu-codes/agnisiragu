// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GuestController } from './guest.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, GuestController],
  exports: [UsersService],
})
export class UsersModule {}
