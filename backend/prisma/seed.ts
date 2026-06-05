import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../src/config/db";

const main = async () => {
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);

    await prisma.user.upsert({
      where: { phone: "9999999999" },
      update: {
        name: "Admin",
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        name: "Admin",
        phone: "9999999999",
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    await prisma.settings.upsert({
      where: { key: "upi_qr_url" },
      update: {},
      create: {
        key: "upi_qr_url",
        value: "",
      },
    });

    console.log("Seed completed: default admin account is ready.");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
};

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
