// src/media/media.service.ts
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;  // 50 MB

@Injectable()
export class MediaService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.config.get<string>('AWS_REGION', 'ap-south-1'),
    });
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', 'agnisiragu-media');
  }

  async upload(file: Express.Multer.File): Promise<{ data: { url: string; key: string; type: string } }> {
    const mimeType = file.mimetype;
    const isImage = IMAGE_TYPES.includes(mimeType);
    const isVideo = VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Allowed: jpg, png, webp, mp4`,
      );
    }

    const maxSize = isImage ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Max size: ${isImage ? '5MB' : '50MB'}`,
      );
    }

    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
    const folder = isImage ? 'images' : 'videos';
    const key = `${folder}/${uuidv4()}.${ext}`;

    try {
      const result = await this.s3
        .upload({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        })
        .promise();

      return {
        data: {
          url: result.Location,
          key,
          type: isImage ? 'image' : 'video',
        },
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }
}
