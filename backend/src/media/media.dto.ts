// src/media/media.dto.ts
import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BakeWatermarkDto {
  @ApiProperty({ description: 'Cloudinary public_id of the already-uploaded asset', example: 'agnisiragu/abcd1234' })
  @IsString()
  publicId: string;

  @ApiProperty({ enum: ['image', 'video'] })
  @IsIn(['image', 'video'])
  resourceType: 'image' | 'video';
}
