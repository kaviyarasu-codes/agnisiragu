// src/teams/teams.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TeamsService, CreateTeamDto, UpdateTeamDto } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  findAll() { return this.teamsService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get single team' })
  findOne(@Param('id') id: string) { return this.teamsService.findOne(id); }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create team (super admin only)' })
  create(@Body() dto: CreateTeamDto, @CurrentUser('id') adminId: string) {
    return this.teamsService.create(dto, adminId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update team' })
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto, @CurrentUser('id') adminId: string) {
    return this.teamsService.update(id, dto, adminId);
  }

  @Patch(':id/toggle')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Toggle team active/inactive' })
  toggle(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.teamsService.toggleActive(id, adminId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete team' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.teamsService.remove(id, adminId);
  }
}
