import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isCloudinaryReady = false;

  constructor() {
    this.configureCloudinary();
  }

  /**
   * Initialize and configure Cloudinary SDK with environment credentials
   */
  private configureCloudinary(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret && cloudName.trim() !== '' && apiKey.trim() !== '' && apiSecret.trim() !== '') {
      cloudinary.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        secure: true,
      });
      this.isCloudinaryReady = true;
      this.logger.log(`Cloudinary object storage initialized successfully for cloud: ${cloudName.trim()}`);
    } else {
      this.isCloudinaryReady = false;
      this.logger.warn('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not fully configured in environment.');
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    if (!this.isCloudinaryReady) {
      this.configureCloudinary();
    }
    return this.isCloudinaryReady;
  }

  /**
   * Validate and upload image data to Cloudinary persistent storage
   * Supports base64 data URLs and remote URLs.
   *
   * @param imageInput Base64 data URL (e.g. data:image/jpeg;base64,...) or HTTPS URL
   * @param options Target folder or complaint image type ('BEFORE' | 'RESOLUTION')
   */
  async uploadImage(
    imageInput: string,
    options?: { folder?: string; type?: 'BEFORE' | 'RESOLUTION' }
  ): Promise<{ url: string; publicId?: string; secureUrl: string }> {
    if (!imageInput || typeof imageInput !== 'string' || imageInput.trim() === '') {
      throw new BadRequestException('No image data provided for upload.');
    }

    const trimmedInput = imageInput.trim();

    // If input is already an existing Cloudinary or HTTPS image URL, return it directly
    if (trimmedInput.startsWith('https://res.cloudinary.com/') || trimmedInput.startsWith('http://res.cloudinary.com/')) {
      return {
        url: trimmedInput.replace('http://', 'https://'),
        secureUrl: trimmedInput.replace('http://', 'https://'),
      };
    }

    // Determine target folder
    const targetFolder =
      options?.folder ||
      (options?.type === 'RESOLUTION'
        ? 'smart-civic-connect/complaints/resolution'
        : 'smart-civic-connect/complaints/before');

    // If it is a base64 data URL, validate MIME type and size
    if (trimmedInput.startsWith('data:image')) {
      const mimeMatch = trimmedInput.match(/^data:image\/([a-zA-Z0-9+.-]+)(?:;[a-zA-Z0-9=+._-]+)*;base64,(.+)$/s);
      if (!mimeMatch) {
        throw new BadRequestException('Invalid image format. Must be a valid base64-encoded image data URL.');
      }

      const rawExt = mimeMatch[1].toLowerCase();
      const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg', 'svg+xml', 'gif']);
      if (!allowedExtensions.has(rawExt)) {
        throw new BadRequestException(`Unsupported image format: image/${rawExt}. Supported formats: JPG, JPEG, PNG, WEBP, SVG, GIF.`);
      }

      // Validate base64 payload size (max ~10MB)
      const base64Data = mimeMatch[2];
      const approximateSizeBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (approximateSizeBytes > maxSizeBytes) {
        throw new BadRequestException('Uploaded image exceeds the 10MB maximum size limit.');
      }
    } else if (!trimmedInput.startsWith('http://') && !trimmedInput.startsWith('https://')) {
      throw new BadRequestException('Invalid image payload. Expected base64 data URL or HTTP/HTTPS image URL.');
    }

    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Cloudinary persistent storage is not configured on the server. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in environment variables.'
      );
    }

    try {
      const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(trimmedInput, {
        folder: targetFolder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      });

      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('Cloudinary response did not contain a secure URL.');
      }

      this.logger.log(`Uploaded complaint image successfully to Cloudinary: ${uploadResult.public_id}`);

      return {
        url: uploadResult.secure_url,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (err: any) {
      this.logger.error(`Cloudinary upload failed: ${err.message || err}`, err.stack);
      
      // Sanitize error message so secrets or internal paths are never leaked
      const rawMessage = (err.message || '').toString();
      const sanitized = rawMessage.replace(/api_key=[\w\d]+/gi, 'api_key=***').replace(/api_secret=[\w\d]+/gi, 'api_secret=***');

      throw new BadRequestException(`Image upload to cloud storage failed: ${sanitized || 'Unknown error'}`);
    }
  }
}
