const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xVjViEMLJfXOLBVmNCDlZXBaRUKpmDYm@roundhouse.proxy.rlwy.net:36298/railway"
    }
  }
});

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'fakehash',
    }
  });

  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title: 'Test Meeting',
      participants: ['iamkrish.kukreja@gmail.com'],
      meetingDate: new Date(),
      transcript: []
    }
  });

  await prisma.actionItem.create({
    data: {
      meetingId: meeting.id,
      task: 'Fix the login bug',
      assignee: 'iamkrish.kukreja@gmail.com',
      status: 'PENDING',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  });
  console.log('Created overdue action item successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
