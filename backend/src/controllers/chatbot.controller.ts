import { Controller, Post, Body } from '@nestjs/common';
import { AIService } from '../services/ai.service';

@Controller('api/chatbot')
export class ChatbotController {
  constructor(private readonly aiService: AIService) {}

  @Post('message')
  async handleUserMessage(@Body() body: { message: string; userId?: string; language?: string }) {
    const lang = body.language || 'EN';
    const result = await this.aiService.generateChatbotResponse(body.message, lang);
    return {
      timestamp: new Date().toISOString(),
      userMessage: body.message,
      response: result.response,
      intent: result.intent,
      quickReplies: result.quickReplies || [],
      language: lang,
    };
  }
}
