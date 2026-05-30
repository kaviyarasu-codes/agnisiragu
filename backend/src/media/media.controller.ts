// src/media/media.controller.ts
import {
  Controller, Post, UseInterceptors, UploadedFile, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @UseInterceptors(FileInterceptor('file', { storage: undefined })) // memory storage
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload image (jpg/png/webp, max 5MB) or video (mp4, max 50MB)' })
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.upload(file);
  }
}
