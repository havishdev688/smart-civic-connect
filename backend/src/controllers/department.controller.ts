import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { DbService } from '../services/db.service';

@Controller('api/departments')
export class DepartmentController {
  constructor(private readonly db: DbService) {}

  @Get()
  async getDepartments() {
    const departments = await this.db.department.findMany({
      include: {
        _count: {
          select: {
            complaints: true,
          }
        }
      }
    });

    // Compute active and resolved per department
    const result = await Promise.all(departments.map(async (dept) => {
      const activeComplaints = await this.db.complaint.count({
        where: {
          departmentId: dept.id,
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        }
      });
      const totalResolved = await this.db.complaint.count({
        where: {
          departmentId: dept.id,
          status: { in: ['RESOLVED', 'CLOSED'] }
        }
      });

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        icon: dept.icon,
        description: dept.description,
        slaHours: dept.slaHours,
        activeComplaints,
        totalResolved,
      };
    }));

    return result;
  }

  @Put(':id/sla')
  async updateSLA(@Param('id') id: string, @Body() body: { slaHours: number }) {
    const updated = await this.db.department.update({
      where: { id },
      data: { slaHours: body.slaHours }
    });
    return { message: 'SLA updated successfully', department: updated };
  }
}
