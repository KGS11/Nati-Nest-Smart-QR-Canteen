import { prisma } from "../config/db";

async function run() {
  let table = await prisma.restaurantTable.findUnique({
    where: { tableNumber: "1" }
  });

  if (!table) {
    table = await prisma.restaurantTable.create({
      data: {
        tableNumber: "1",
        qrCodeUrl: "http://localhost:3000/scan/1",
        status: "AVAILABLE"
      }
    });
    console.log("Table 1 created successfully with ID:", table.id);
  } else {
    console.log("Table 1 already exists with ID:", table.id);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
