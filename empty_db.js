const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Emptying all data from the database...');
  const tablenames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
        console.log(`Truncated ${tablename}`);
      } catch (error) {
        console.error(`Failed to truncate ${tablename}:`, error);
      }
    }
  }
  console.log('Database successfully emptied.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
