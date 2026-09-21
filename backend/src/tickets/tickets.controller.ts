// src/tickets/tickets.controller.ts
import {
  Controller, Get, Post, Patch,
  Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const reflector = new Reflector();

class CreateTicketDto {
  @IsString() @MinLength(2)  title: string;
  @IsString() @MinLength(2)  description: string;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH']) priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

class UpdateTicketDto {
  @IsOptional() @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED']) status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  @IsOptional() @IsString() resolutionNote?: string;
}

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Controller('admin/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // No @Roles() — open to any authenticated admin; TicketsService itself
  // rejects SUPER_ADMIN/ADMIN (they resolve tickets, they don't raise them).
  @Post()
  @ApiOperation({ summary: 'Raise a support ticket (Managers/Members only)' })
  createTicket(
    @CurrentUser('id') id: string,
    @CurrentUser('adminRole') role: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.createTicket(id, role, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Tickets the current admin has raised' })
  getMyTickets(@CurrentUser('id') id: string) {
    return this.ticketsService.getMyTickets(id);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] })
  @ApiOperation({ summary: 'All tickets — shared pool (SUPER_ADMIN/ADMIN only)' })
  getAllTickets(@Query('status') status?: string) {
    return this.ticketsService.getAllTickets(status);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update/resolve a ticket (SUPER_ADMIN/ADMIN only)' })
  updateTicket(
    @Param('id') id: string,
    @CurrentUser('id') resolverId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(id, resolverId, dto);
  }
}
