import { SessionStatus, TableStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { generateQRCodeDataURL, generateTableQRText } from "../utils/qrcode.util";

type TableCreateData = {
  tableNumber: string;
};

type TableUpdateData = {
  tableNumber?: string;
};

const withActiveSessionCount = async <T extends { id: string }>(table: T) => {
  const activeSessionCount = await prisma.tableSession.count({
    where: {
      tableId: table.id,
      status: SessionStatus.ACTIVE,
    },
  });

  return {
    ...table,
    activeSessionCount,
  };
};

export class TableService {
  async getAllTables() {
    try {
      const tables = await prisma.restaurantTable.findMany({
        orderBy: { tableNumber: "asc" },
        include: {
          _count: {
            select: {
              sessions: {
                where: { status: SessionStatus.ACTIVE },
              },
            },
          },
        },
      });

      return tables.map((table) => ({
        ...table,
        activeSessionCount: table._count.sessions,
        _count: undefined,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getTableById(id: string) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { id },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      return withActiveSessionCount(table);
    } catch (error) {
      throw error;
    }
  }

  async createTable(data: TableCreateData) {
    try {
      const tableNumber = data.tableNumber.trim();
      const existingTable = await prisma.restaurantTable.findUnique({
        where: { tableNumber },
      });

      if (existingTable) {
        throw new AppError("Table number already exists", 409);
      }

      const qrCodeUrl = await generateQRCodeDataURL(generateTableQRText(tableNumber));

      return prisma.restaurantTable.create({
        data: {
          tableNumber,
          qrCodeUrl,
        },
      });
    } catch (error) {
      // Handle race condition: two concurrent requests may both pass the findUnique
      // check and then one fails on the DB unique constraint (Prisma error P2002).
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        throw new AppError("Table number already exists", 409);
      }
      throw error;
    }
  }

  async updateTable(id: string, data: TableUpdateData) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { id },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      const updateData: TableUpdateData & { qrCodeUrl?: string } = {};

      if (data.tableNumber !== undefined) {
        const tableNumber = data.tableNumber.trim();

        if (tableNumber !== table.tableNumber) {
          const existingTable = await prisma.restaurantTable.findUnique({
            where: { tableNumber },
          });

          if (existingTable) {
            throw new AppError("Table number already exists", 409);
          }

          updateData.tableNumber = tableNumber;
          updateData.qrCodeUrl = await generateQRCodeDataURL(generateTableQRText(tableNumber));
        }
      }

      return prisma.restaurantTable.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw error;
    }
  }

  async regenerateQRCode(id: string) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { id },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      const qrCodeUrl = await generateQRCodeDataURL(generateTableQRText(table.tableNumber));

      return prisma.restaurantTable.update({
        where: { id },
        data: { qrCodeUrl },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateTableStatus(id: string, status: TableStatus) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { id },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      if (status === TableStatus.AVAILABLE) {
        const activeSessionCount = await prisma.tableSession.count({
          where: {
            tableId: id,
            status: SessionStatus.ACTIVE,
          },
        });

        if (activeSessionCount > 0) {
          throw new AppError("Cannot mark table as Available while an active session is open.", 409);
        }
      }

      return prisma.restaurantTable.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteTable(id: string) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { id },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      const activeSessionCount = await prisma.tableSession.count({
        where: {
          tableId: id,
          status: SessionStatus.ACTIVE,
        },
      });

      if (activeSessionCount > 0) {
        throw new AppError("Cannot delete table with an active session.", 409);
      }

      // Check for ANY historical session (regardless of status) to preserve data integrity.
      // This future-proofs the guard against new SessionStatus values being added later.
      const totalSessionCount = await prisma.tableSession.count({
        where: { tableId: id },
      });

      if (totalSessionCount > 0) {
        throw new AppError(
          "Cannot delete table with historical session data. Disable the table instead.",
          400,
        );
      }

      await prisma.restaurantTable.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }
  async getTableByNumber(tableNumber: string) {
    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableNumber: tableNumber.trim() },
        select: { id: true, tableNumber: true, status: true },
      });

      if (!table) {
        throw new AppError("Table not found", 404);
      }

      return table;
    } catch (error) {
      throw error;
    }
  }
}

export const tableService = new TableService();
