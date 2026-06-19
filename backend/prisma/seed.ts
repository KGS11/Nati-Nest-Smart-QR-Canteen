import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../src/config/db";

const main = async () => {
  try {
    const adminHash = await bcrypt.hash("admin123", 10);
    const waiterHash = await bcrypt.hash("waiter123", 10);
    const kitchenHash = await bcrypt.hash("kitchen123", 10);

    await prisma.user.upsert({
      where: { phone: "9999999999" },
      update: {
        name: "Admin",
        passwordHash: adminHash,
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        name: "Admin",
        phone: "9999999999",
        passwordHash: adminHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { phone: "8888888888" },
      update: {
        name: "Default Waiter",
        passwordHash: waiterHash,
        role: Role.SERVER,
        isActive: true,
      },
      create: {
        name: "Default Waiter",
        phone: "8888888888",
        passwordHash: waiterHash,
        role: Role.SERVER,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { phone: "7777777777" },
      update: {
        name: "Default Kitchen",
        passwordHash: kitchenHash,
        role: Role.KITCHEN,
        isActive: true,
      },
      create: {
        name: "Default Kitchen",
        phone: "7777777777",
        passwordHash: kitchenHash,
        role: Role.KITCHEN,
        isActive: true,
      },
    });

    const defaultSettings = [
      { key: "business_name", value: "Nati Nest" },
      { key: "business_address", value: "" },
      { key: "business_phone", value: "" },
      { key: "business_tax_rate", value: "0" },
      { key: "upi_id", value: "" },
      { key: "logo_url", value: "" },
      { key: "upi_qr_url", value: "" },
    ];

    for (const setting of defaultSettings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
        },
      });
    }

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
