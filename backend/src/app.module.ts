import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { ComplaintController } from './controllers/complaint.controller';
import { DepartmentController } from './controllers/department.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ChatbotController } from './controllers/chatbot.controller';
import { NotificationController } from './controllers/notification.controller';
import { UploadController } from './controllers/upload.controller';
import { AIService } from './services/ai.service';
import { DbService } from './services/db.service';
import { CloudinaryService } from './services/cloudinary.service';

@Module({
  imports: [],
  controllers: [
    AuthController,
    ComplaintController,
    DepartmentController,
    AnalyticsController,
    ChatbotController,
    NotificationController,
    UploadController,
  ],
  providers: [AIService, DbService, CloudinaryService],
})
export class AppModule {}
