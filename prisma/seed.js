const { PrismaClient } = require("@prisma/client");
const { createClerkClient } = require("@clerk/backend");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "subhrajyotisahoo08@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Asperai4sih1234567";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY must be defined in the environment");
  }

  const clerk = createClerkClient({ secretKey });

  let clerkUserId = process.env.ADMIN_CLERK_USER_ID;

  if (!clerkUserId) {
    console.log(`Checking if user with email ${adminEmail} exists in Clerk...`);
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [adminEmail],
    });

    if (users && users.length > 0) {
      clerkUserId = users[0].id;
      console.log(`Found existing Clerk user: ${clerkUserId}`);
    } else {
      console.log(`User not found in Clerk. Creating new Clerk user...`);
      try {
        const newClerkUser = await clerk.users.createUser({
          emailAddress: [adminEmail],
          password: adminPassword,
          username: adminUsername,
        });
        clerkUserId = newClerkUser.id;
        console.log(`Created new Clerk user: ${clerkUserId}`);
      } catch (err) {
        console.warn("Could not create user with username. Retrying with just email and password...", err.message);
        const newClerkUser = await clerk.users.createUser({
          emailAddress: [adminEmail],
          password: adminPassword,
        });
        clerkUserId = newClerkUser.id;
        console.log(`Created new Clerk user: ${clerkUserId}`);
      }
    }
  }

  console.log(`Seeding user in database: ${adminEmail} (${clerkUserId})...`);

  const admin = await prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: adminEmail,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      clerkUserId,
      email: adminEmail,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log(`Updating Clerk user metadata for ${clerkUserId}...`);
  try {
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        role: "ADMIN",
        status: "APPROVED",
      },
    });
    console.log("Clerk user metadata updated successfully.");
  } catch (err) {
    console.error("Failed to update Clerk user metadata:", err.message);
  }

  console.log("Admin seeded successfully in the database:", admin);

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

