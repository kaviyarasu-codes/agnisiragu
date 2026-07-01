// src/media/media.service.ts
import {
  Injectable, BadRequestException, NotFoundException,
  InternalServerErrorException, Logger, ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private cloudinaryConfigured = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const cloudName  = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey     = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret  = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.cloudinaryConfigured = true;
      this.logger.log('Cloudinary initialized');
    } else {
      this.logger.warn('Cloudinary credentials not configured');
    }
  }

  async upload(file: Express.Multer.File, adminId?: string) {
    if (!this.cloudinaryConfigured) {
      throw new ServiceUnavailableException('Media upload not configured. Set CLOUDINARY_* env vars.');
    }
    if (!file) throw new BadRequestException('No file provided');

    const isImage = IMAGE_TYPES.includes(file.mimetype);
    const isVideo = VIDEO_TYPES.includes(file.mimetype);
    if (!isImage && !isVideo) {
      throw new BadRequestException(`Unsupported: ${file.mimetype}. Allowed: jpg, png, webp, gif, mp4`);
    }
    if (file.size > (isImage ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES)) {
      throw new BadRequestException(`File too large. Max: ${isImage ? '5MB' : '50MB'}`);
    }

    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'agnisiragu',
            resource_type: isImage ? 'image' : 'video',
            ...(isImage && { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
          },
          (err, res) => (err || !res ? reject(err ?? new Error('Upload failed')) : resolve(res as any)),
        );
        const readable = new Readable();
        readable.push(file.buffer);
        readable.push(null);
        readable.pipe(stream);
      });

      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          filename: file.originalname,
          url:      result.secure_url,
          publicId: result.public_id,
          mimeType: file.mimetype,
          size:     file.size,
          ...(adminId ? { adminId } : {}),
        },
      });

      return {
        data: {
          id:       mediaFile.id,
          url:      mediaFile.url,
          key:      mediaFile.publicId,
          type:     isImage ? 'image' : 'video',
          filename: mediaFile.filename,
          size:     mediaFile.size,
        },
      };
    } catch (err) {
      this.logger.error('Upload failed', err.message);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async findAll(options: { type?: string; search?: string; page?: number; limit?: number }) {
    const { type, search, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type && type !== 'all') where.mimeType = { startsWith: `${type}/` };
    if (search) where.filename = { contains: search, mode: 'insensitive' };

    const [files, total] = await Promise.all([
      this.prisma.mediaFile.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true } } },
      }),
      this.prisma.mediaFile.count({ where }),
    ]);
    return { data: files, meta: { total, page, limit, hasMore: skip + limit < total } };
  }

  async delete(id: string): Promise<void> {
    const file = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    if (this.cloudinaryConfigured && file.publicId) {
      try {
        const resourceType = file.mimeType.startsWith('video/') ? 'video' : 'image';
        await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType });
      } catch (err) {
        this.logger.warn(`Cloudinary delete failed: ${err.message}`);
      }
    }
    await this.prisma.mediaFile.delete({ where: { id } });
  }
}
