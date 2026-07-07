import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";

  return raw
    .split(",")
    .flatMap((value) => {
      const result = value.trim().toLowerCase();
      return result ? [result] : [];
    });
}

async function main() {
  const adminEmails = parseAdminEmails();

  if (adminEmails.length === 0) {
    console.log("No admin emails configured. Skipping seed.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: adminEmails,
        mode: "insensitive",
      },
    },
    data: {
      role: "admin",
    },
  });

  console.log(`Seed completed. Updated ${result.count} user(s) to admin role.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
