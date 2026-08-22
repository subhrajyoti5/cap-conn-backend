const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "subhrajyotisahoo08@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Asperai4sih1234567";

  console.log(`Seeding admin user: ${adminEmail}...`);

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log("Admin seeded successfully in the database:", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
  });

  const defaultSubjects = [
    { name: "Computer Science", description: "Coding, software engineering, and systems" },
    { name: "Mathematics", description: "Pure and applied mathematics" },
    { name: "Science", description: "Physics, chemistry, and biology" },
    { name: "Business & Management", description: "Administration, marketing, and leadership" },
  ];

  console.log("Seeding default subjects...");
  for (const subject of defaultSubjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: { description: subject.description },
      create: {
        name: subject.name,
        description: subject.description,
      },
    });
  }
  console.log("Subjects seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
