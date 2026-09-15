import { Controller, Get, Put, Param, Query, BadRequestException } from '@nestjs/common';
import { DbService } from '../services/db.service';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly db: DbService) {}

  @Get()
  async getNotifications(@Query('userId') userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const notifications = await this.db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
      notifications: notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        type: n.type,
        createdAt: n.createdAt.toISOString(),
      }))
    };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.db.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    const updated = await this.db.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return {
      message: 'Notification marked as read',
      notification: updated
    };
  }

  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { message: 'All notifications marked as read' };
  }
}
