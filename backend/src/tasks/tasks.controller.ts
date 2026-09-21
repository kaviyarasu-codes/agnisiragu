// src/tasks/tasks.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { IsString, IsOptional, MinLength, IsIn, IsDateString } from 'class-validator';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const reflector = new Reflector();

class CreateTaskDto {
  @IsString() @MinLength(2)   title: string;
  @IsOptional() @IsString()   description?: string;
  @IsString()                 assignedToId: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

class UpdateTaskStatusDto {
  @IsIn(['NEW', 'IN_PROGRESS', 'DONE']) status: 'NEW' | 'IN_PROGRESS' | 'DONE';
}

// No @Roles()/RolesGuard here — every route is open to any authenticated
// admin, and the assignment-hierarchy rules (who may assign to whom, who
// may update/delete a given task) are enforced inside TasksService based on
// the requester's own id/adminRole/teamType, since they depend on the
// *relationship* between requester and target, not a fixed role list.
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector))
@Controller('admin/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('assignable-users')
  @ApiOperation({ summary: 'Admins the current user is allowed to assign a task to (empty if none)' })
  getAssignableUsers(
    @CurrentUser('id') id: string,
    @CurrentUser('adminRole') role: string,
    @CurrentUser('teamType') team: string,
  ) {
    return this.tasksService.getAssignableUsers(id, role, team ?? null);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Tasks assigned to the current admin' })
  getMyTasks(@CurrentUser('id') id: string) {
    return this.tasksService.getMyTasks(id);
  }

  @Get('assigned-by-me')
  @ApiOperation({ summary: 'Tasks the current admin has assigned to others' })
  getAssignedByMe(@CurrentUser('id') id: string) {
    return this.tasksService.getAssignedByMe(id);
  }

  @Post()
  @ApiOperation({ summary: 'Assign a new task (SUPER_ADMIN/ADMIN to anyone; *_MANAGER to same-team members)' })
  createTask(
    @CurrentUser('id') id: string,
    @CurrentUser('adminRole') role: string,
    @CurrentUser('teamType') team: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(id, role, team ?? null, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a task status (assignee, assigner, or SUPER_ADMIN/ADMIN)' })
  updateStatus(
    @Param('id') taskId: string,
    @CurrentUser('id') id: string,
    @CurrentUser('adminRole') role: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(taskId, id, role, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task (assigner or SUPER_ADMIN/ADMIN only)' })
  deleteTask(
    @Param('id') taskId: string,
    @CurrentUser('id') id: string,
    @CurrentUser('adminRole') role: string,
  ) {
    return this.tasksService.deleteTask(taskId, id, role);
  }
}
