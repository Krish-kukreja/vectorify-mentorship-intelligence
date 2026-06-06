const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xVjViEMLJfXOLBVmNCDlZXBaRUKpmDYm@roundhouse.proxy.rlwy.net:36298/railway"
    }
  }
});

prisma.reminderLog.findMany()
  .then(logs => {
    console.log(JSON.stringify(logs, null, 2));
    prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
