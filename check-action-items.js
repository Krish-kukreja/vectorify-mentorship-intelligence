require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.actionItem.findMany()
  .then(items => {
    console.log(JSON.stringify(items, null, 2));
    prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
