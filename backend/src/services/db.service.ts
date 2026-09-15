import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DbService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Connected to PostgreSQL Database via Prisma');
    } catch (err) {
      console.warn('PostgreSQL Database connection failed or DATABASE_URL not configured. Operating in fallback mode.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
