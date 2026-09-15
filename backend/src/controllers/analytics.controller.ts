import { Controller, Get } from '@nestjs/common';
import { DbService } from '../services/db.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly db: DbService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    const totalComplaints = await this.db.complaint.count();
    const activeComplaints = await this.db.complaint.count({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } }
    });
    const resolvedComplaints = await this.db.complaint.count({
      where: { status: { in: ['RESOLVED', 'CLOSED'] } }
    });

    const resolutionRate = totalComplaints > 0 ? parseFloat(((resolvedComplaints / totalComplaints) * 100).toFixed(1)) : 0;

    // AI accuracy from predictions
    const predictions = await this.db.aIPrediction.findMany({
      select: { confidenceScore: true }
    });
    const aiClassificationAccuracy = predictions.length > 0
      ? parseFloat((predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length * 100).toFixed(1))
      : 0;

    // Duplicates count
    const duplicatesPrevented = await this.db.complaint.count({
      where: { duplicateOfId: { not: null } }
    });

    // Citizen satisfaction
    const ratings = await this.db.complaint.findMany({
      where: { rating: { not: null } },
      select: { rating: true }
    });
    const citizenSatisfaction = ratings.length > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1))
      : 0;

    // Department breakdown
    const departments = await this.db.department.findMany();
    const departmentBreakdown = await Promise.all(departments.map(async (dept) => {
      const total = await this.db.complaint.count({ where: { departmentId: dept.id } });
      const resolved = await this.db.complaint.count({ where: { departmentId: dept.id, status: { in: ['RESOLVED', 'CLOSED'] } } });
      const pending = total - resolved;
      return { name: dept.name, total, resolved, pending, slaHours: dept.slaHours };
    }));

    // Priority distribution
    const priorities = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'];
    const priorityDistribution = await Promise.all(priorities.map(async (p) => {
      const count = await this.db.complaint.count({ where: { priority: p as any } });
      const percentage = totalComplaints > 0 ? parseFloat(((count / totalComplaints) * 100).toFixed(1)) : 0;
      return { label: p, count, percentage };
    }));

    return {
      summary: {
        totalComplaints,
        activeComplaints,
        resolvedComplaints,
        resolutionRate,
        aiClassificationAccuracy,
        duplicatesPrevented,
        citizenSatisfaction,
      },
      departmentBreakdown,
      priorityDistribution,
    };
  }

  @Get('audit-logs')
  async getAuditLogs() {
    const logs = await this.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } }
    });

    if (logs.length === 0) {
      return [{ id: 'none', action: 'INFO', details: 'No audit logs recorded yet.', user: 'System', timestamp: new Date().toISOString() }];
    }

    return logs.map(l => ({
      id: l.id,
      action: l.action,
      details: l.details,
      user: l.user?.email || 'System',
      timestamp: l.createdAt.toISOString(),
    }));
  }
}
