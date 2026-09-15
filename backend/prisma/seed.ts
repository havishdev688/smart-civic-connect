import { PrismaClient, Role, Priority, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Smart Civic Connect database...');

  // Clear existing data to ensure a fresh start
  console.log('Clearing old data...');
  await prisma.aIPrediction.deleteMany({});
  await prisma.statusHistory.deleteMany({});
  await prisma.complaintImage.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  // Create Departments
  const deptData = [
    { name: 'Roads & Asphalt', code: 'ROADS_ASPHALT', icon: 'HardHat', description: 'Potholes, broken tar, pavement damage & footpath repairs.', slaHours: 48 },
    { name: 'Water Supply', code: 'WATER_SUPPLY', icon: 'Droplets', description: 'Pipeline bursts, contaminated water & emergency tanker requests.', slaHours: 24 },
    { name: 'Sanitation & Health', code: 'SANITATION_HEALTH', icon: 'Trash2', description: 'Garbage dump clearing, street sweeping & vector control.', slaHours: 24 },
    { name: 'Street Lighting', code: 'STREET_LIGHTING', icon: 'Zap', description: 'Dark streets, non-functional LED poles & loose wiring.', slaHours: 12 },
  ];

  const createdDepts: Record<string, any> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    createdDepts[d.code] = dept;
  }

  // Users
  const adminHashed = await bcrypt.hash('admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@123' },
    update: { password: adminHashed, role: Role.ADMIN, name: 'Admin' },
    create: {
      email: 'admin@123',
      password: adminHashed,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  const officerConfigs = [
    { email: 'roaddept@123', name: 'Road Officer', dept: 'ROADS_ASPHALT' },
    { email: 'waterdept@123', name: 'Water Officer', dept: 'WATER_SUPPLY' },
    { email: 'sanitationdept@123', name: 'Sanitation Officer', dept: 'SANITATION_HEALTH' },
    { email: 'street@123', name: 'Street Officer', dept: 'STREET_LIGHTING' },
  ];

  for (const oc of officerConfigs) {
    const hashed = await bcrypt.hash(oc.email, 10); // Password same as username initially
    await prisma.user.upsert({
      where: { email: oc.email },
      update: { password: hashed, role: Role.OFFICER, name: oc.name, departmentId: createdDepts[oc.dept].id },
      create: {
        email: oc.email,
        password: hashed,
        name: oc.name,
        role: Role.OFFICER,
        departmentId: createdDepts[oc.dept].id,
      },
    });
  }

  console.log('Seed completed successfully! 4 Departments, 1 Admin, 4 Officers, 0 Complaints.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
