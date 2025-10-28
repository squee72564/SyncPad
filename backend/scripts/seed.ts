import prisma from "../src/lib/prisma.js";
import auth from "../src/lib/auth.js";
import logger from "../src/config/logger.js";

async function main() {
  const user = await auth.api.createUser({
    body: {
      email: "testadmin@gmail.com",
      password: "password123",
      name: "admin_user1",
      role: "admin",
    },
  });

  logger.info("Admin user created:", user);

  const superAdmin = await auth.api.createUser({
    body: {
      email: "superadmin@gmail.com",
      password: "password123",
      name: "super_admin1",
      role: "superAdmin",
    },
  });

  logger.info("Super Admin user created:", superAdmin);

  for (let i = 1; i <= 5; i++) {
    const exampleUser = await auth.api.createUser({
      body: {
        email: `testemail${i}@gmail.com`,
        password: "password123",
        name: `example_user${i}`,
        role: "user",
      },
    });
    logger.info(`Example user ${i} created:`, exampleUser);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  logger.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
