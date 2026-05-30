// src/users/users.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './users.dto';
import { Reflector } from '@nestjs/core';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(new Reflector()))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Get('me/reads')
  @ApiOperation({ summary: 'Get article read count for current user' })
  getReadCount(@CurrentUser('id') userId: string) {
    return this.usersService.getReadCount(userId);
  }
}
