require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'mentor@vectorify.in',
      passwordHash: 'fakehash',
    }
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      title: 'Physics - Rotational Motion Doubt Session',
      participants: ['iamkrish.kukreja@gmail.com'],
      sessionDate: new Date(),
      transcript: []
    }
  });

  await prisma.actionItem.create({
    data: {
      sessionId: session.id,
      task: 'Solve 20 rotational motion problems from DC Pandey',
      assignee: 'iamkrish.kukreja@gmail.com',
      status: 'PENDING',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  });
  console.log('Created overdue action item successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
