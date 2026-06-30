require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.reminderLog.findMany()
  .then(logs => {
    console.log(JSON.stringify(logs, null, 2));
    prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
