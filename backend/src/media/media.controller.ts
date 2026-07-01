// src/media/media.controller.ts
import {
  Controller, Post, Get, Delete, UseInterceptors,
  UploadedFile, UseGuards, Param, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Media')
@Controller('media')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload image (max 5MB) or video (max 50MB)' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') adminId: string,
  ) {
    return this.mediaService.upload(file, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'List media files' })
  @ApiQuery({ name: 'type',   required: false, description: 'image | video | all' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  findAll(
    @Query('type')   type?: string,
    @Query('search') search?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.mediaService.findAll({
      type,
      search,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a media file (removes from Cloudinary + DB)' })
  async delete(@Param('id') id: string) {
    await this.mediaService.delete(id);
    return { data: { message: 'File deleted' } };
  }
}
