import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('=== STARTING DETERMINISTIC DATABASE CLEANUP ===');

  // Pre-cleanup counts
  const initialCounts = {
    complaints: await prisma.complaint.count(),
    images: await prisma.complaintImage.count(),
    statusHistory: await prisma.statusHistory.count(),
    aiPredictions: await prisma.aIPrediction.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
    chatMessages: await prisma.chatMessage.count(),
    otpVerifications: await prisma.otpVerification.count(),
    resetTokens: await prisma.passwordResetToken.count(),
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
  };

  console.log('Pre-cleanup record counts:', initialCounts);

  // Execute in an atomic transaction
  const deleteResults = await prisma.$transaction(async (tx) => {
    // 1. Break self-referencing duplicate relationships on Complaint
    const unlinkedDuplicates = await tx.complaint.updateMany({
      where: { duplicateOfId: { not: null } },
      data: { duplicateOfId: null },
    });
    console.log(`Unlinked ${unlinkedDuplicates.count} duplicate complaint self-references.`);

    // 2. Delete child records of Complaint (ComplaintImage, StatusHistory, AIPrediction)
    const deletedImages = await tx.complaintImage.deleteMany();
    const deletedStatusHistory = await tx.statusHistory.deleteMany();
    const deletedAiPredictions = await tx.aIPrediction.deleteMany();

    // 3. Delete all Complaints
    const deletedComplaints = await tx.complaint.deleteMany();

    // 4. Delete Notifications
    const deletedNotifications = await tx.notification.deleteMany();

    // 5. Delete AuditLogs
    const deletedAuditLogs = await tx.auditLog.deleteMany();

    // 6. Delete ChatMessages
    const deletedChatMessages = await tx.chatMessage.deleteMany();

    // 7. Delete ephemeral OTP verifications and password reset tokens
    const deletedOtp = await tx.otpVerification.deleteMany();
    const deletedTokens = await tx.passwordResetToken.deleteMany();

    return {
      unlinkedDuplicates: unlinkedDuplicates.count,
      deletedImages: deletedImages.count,
      deletedStatusHistory: deletedStatusHistory.count,
      deletedAiPredictions: deletedAiPredictions.count,
      deletedComplaints: deletedComplaints.count,
      deletedNotifications: deletedNotifications.count,
      deletedAuditLogs: deletedAuditLogs.count,
      deletedChatMessages: deletedChatMessages.count,
      deletedOtp: deletedOtp.count,
      deletedTokens: deletedTokens.count,
    };
  });

  console.log('Deletion results:', deleteResults);

  // Post-cleanup verification counts
  const finalCounts = {
    complaints: await prisma.complaint.count(),
    images: await prisma.complaintImage.count(),
    statusHistory: await prisma.statusHistory.count(),
    aiPredictions: await prisma.aIPrediction.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
    chatMessages: await prisma.chatMessage.count(),
    otpVerifications: await prisma.otpVerification.count(),
    resetTokens: await prisma.passwordResetToken.count(),
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
  };

  console.log('Post-cleanup record counts:', finalCounts);

  // Verify preservation
  const depts = await prisma.department.findMany();
  console.log(`Preserved ${depts.length} departments:`, depts.map(d => `${d.code} (${d.name}) - ${d.slaHours}h SLA`));

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log(`Preserved ${users.length} users:`, users.map(u => `${u.role}: ${u.email} (${u.name})`));

  console.log('=== DATABASE CLEANUP COMPLETED SUCCESSFULLY ===');
}

cleanDatabase()
  .catch((err) => {
    console.error('DATABASE CLEANUP ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
