import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../services/cloudinary.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload image to Cloudinary persistent object storage
   */
  @Post()
  async uploadImage(
    @Body() body: { image: string; type?: 'BEFORE' | 'RESOLUTION'; folder?: string }
  ) {
    if (!body || !body.image) {
      throw new BadRequestException('No image data provided for upload');
    }

    const uploadResult = await this.cloudinaryService.uploadImage(body.image, {
      type: body.type,
      folder: body.folder,
    });

    return {
      url: uploadResult.url,
      secure_url: uploadResult.secureUrl,
      public_id: uploadResult.publicId,
      base64: body.image.startsWith('data:image') ? body.image : undefined,
    };
  }
}
