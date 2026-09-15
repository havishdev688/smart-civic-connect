import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

// Load .env with path fallbacks for different working directories
dotenv.config();
const backendEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
const parentEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Smart Civic Connect Backend API server running on port ${port}`);
}

bootstrap();
