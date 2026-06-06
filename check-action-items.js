const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xVjViEMLJfXOLBVmNCDlZXBaRUKpmDYm@roundhouse.proxy.rlwy.net:36298/railway"
    }
  }
});

prisma.actionItem.findMany()
  .then(items => {
    console.log(JSON.stringify(items, null, 2));
    prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
