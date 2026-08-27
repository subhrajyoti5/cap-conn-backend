const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, status: true }
  });
  console.log("Database Courses:", courses);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
