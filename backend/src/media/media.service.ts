// src/media/media.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;  // 50 MB

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private cloudinaryConfigured = false;

  constructor(private config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.cloudinaryConfigured = true;
      this.logger.log('Cloudinary initialized');
    } else {
      this.logger.warn('Cloudinary credentials not configured — media upload disabled');
    }
  }

  async upload(file: Express.Multer.File): Promise<{ data: { url: string; key: string; type: string } }> {
    if (!this.cloudinaryConfigured) {
      throw new ServiceUnavailableException(
        'Media upload not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway environment.',
      );
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const mimeType = file.mimetype;
    const isImage = IMAGE_TYPES.includes(mimeType);
    const isVideo = VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Allowed: jpg, png, webp, gif, mp4`,
      );
    }

    const maxSize = isImage ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
    if (file.size > maxSize) {
      throw new BadRequestException(`File too large. Max: ${isImage ? '5MB' : '50MB'}`);
    }

    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'agnisiragu',
            resource_type: isImage ? 'image' : 'video',
            ...(isImage && { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve(result as { secure_url: string; public_id: string });
          },
        );
        const readable = new Readable();
        readable.push(file.buffer);
        readable.push(null);
        readable.pipe(uploadStream);
      });

      return {
        data: {
          url: result.secure_url,
          key: result.public_id,
          type: isImage ? 'image' : 'video',
        },
      };
    } catch (err) {
      this.logger.error('Cloudinary upload failed', err.message);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }
}
