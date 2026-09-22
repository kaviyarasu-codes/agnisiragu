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

// Uploaded once via scripts/upload-watermark-logo.ts — see that file for how
// to (re)create this asset. bakeWatermark() below references it.
const WATERMARK_PUBLIC_ID = 'agnisiragu/watermark-logo';

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

  // ─── Watermark ─────────────────────────────────────────────────────────
  // Called right after the admin panel's own direct-to-Cloudinary unsigned
  // upload (article thumbnail + additional media — see ArticleFormPage.tsx)
  // completes. That upload never touches the backend, so this is a separate
  // follow-up step: fetch the asset Cloudinary already has at `publicId`,
  // re-upload it to that SAME public_id with the brand logo composited on
  // top and `overwrite: true` — this bakes the watermark into the actual
  // stored file (not a page/DOM overlay), so it's still there no matter how
  // someone gets the image/video: right-click-save, a direct Cloudinary
  // link, a download button, or a screenshot of the raw file. The URL the
  // browser already has doesn't need to change — Cloudinary just starts
  // serving the watermarked version at that same URL (invalidate: true
  // busts any CDN cache of the pre-watermark version).
  async bakeWatermark(publicId: string, resourceType: 'image' | 'video') {
    if (!this.cloudinaryConfigured) {
      throw new ServiceUnavailableException('Media upload not configured. Set CLOUDINARY_* env vars.');
    }

    // Fetching by URL requires Cloudinary's own CDN to already be serving
    // the asset that was just uploaded seconds earlier — occasionally that
    // isn't propagated yet and the fetch 404s. A couple of short-delay
    // retries clears that up without the caller (admin panel) needing to
    // know anything changed.
    const ATTEMPTS = 3;
    let lastErr: any;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        // version: undefined lets Cloudinary resolve the current version
        // itself; passing the version explicitly (from the upload response)
        // would be more precise but bakeWatermark only receives publicId
        // today — this already fixes the common propagation-lag case.
        const sourceUrl = cloudinary.url(publicId, { resource_type: resourceType, secure: true });
        await cloudinary.uploader.upload(sourceUrl, {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          invalidate: true,
          transformation: [
            {
              overlay: { resource_type: 'image', public_id: WATERMARK_PUBLIC_ID },
              gravity: 'south_east',
              x: 14,
              y: 14,
              width: resourceType === 'video' ? 130 : 90,
              opacity: 75,
              flags: 'layer_apply',
            },
          ],
        });
        return { data: { ok: true } };
      } catch (err) {
        lastErr = err;
        if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }

    // Non-fatal from the caller's point of view — the admin panel already
    // has a usable (un-watermarked) URL from the original upload, so a
    // failure here shouldn't block publishing. Logged so it's visible, and
    // the real Cloudinary error is included in the response (admin-only
    // endpoint, so no sensitive info at risk) so it can be diagnosed from
    // the browser's Network tab without needing server log access.
    const detail = lastErr?.error?.message ?? lastErr?.message ?? String(lastErr);
    this.logger.error(`Watermark bake failed for ${publicId} after ${ATTEMPTS} attempts`, detail);
    throw new InternalServerErrorException(`Failed to apply watermark: ${detail}`);
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
