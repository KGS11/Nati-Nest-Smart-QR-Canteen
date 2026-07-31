import "dotenv/config";
import { PrismaClient, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

type CleanupReport = Record<string, number>;

const requireConfirmation = () => {
  if (!process.argv.includes("--confirm")) {
    console.log("Refusing to clear data without confirmation.");
    console.log("Run: npx ts-node scripts/clear-test-data.ts --confirm");
    process.exit(1);
  }
};

const logReport = (title: string, report: CleanupReport) => {
  console.log(`\n${title}`);
  Object.entries(report).forEach(([label, count]) => {
    console.log(`${label}: ${count}`);
  });
};

async function main() {
  requireConfirmation();

  const report = await prisma.$transaction(async (tx) => {
    const deleted: CleanupReport = {};

    deleted.orderRelatedAuditLogs = (
      await tx.auditLog.deleteMany({
        where: {
          entityType: {
            in: [
              "order",
              "orders",
              "order_item",
              "order_items",
              "payment",
              "payments",
              "payment_adjustment",
              "payment_adjustments",
              "table_session",
              "table_sessions",
              "assistance_request",
              "assistance_requests",
              "waiter_assignment_request",
              "waiter_assignment_requests",
            ],
          },
        },
      })
    ).count;

    deleted.paymentAdjustments = (await tx.paymentAdjustment.deleteMany()).count;
    deleted.waiterAssignmentRequests = (await tx.waiterAssignmentRequest.deleteMany()).count;
    deleted.assistanceRequests = (await tx.assistanceRequest.deleteMany()).count;
    deleted.feedback = (await tx.feedback.deleteMany()).count;

    deleted.cateringLeadsDetachedFromSessions = (
      await tx.cateringLead.updateMany({
        where: { sessionId: { not: null } },
        data: { sessionId: null },
      })
    ).count;

    deleted.payments = (await tx.payment.deleteMany()).count;
    deleted.orderAssignmentHistory = (await tx.orderAssignmentHistory.deleteMany()).count;
    deleted.orderItems = (await tx.orderItem.deleteMany()).count;
    deleted.orders = (await tx.order.deleteMany()).count;
    deleted.tableSessions = (await tx.tableSession.deleteMany()).count;

    deleted.tablesResetToAvailable = (
      await tx.restaurantTable.updateMany({
        where: { status: TableStatus.OCCUPIED },
        data: { status: TableStatus.AVAILABLE },
      })
    ).count;

    return deleted;
  });

  logReport("Production test transaction data cleanup complete", report);
  console.log("\nAuto-increment reset: not applicable. This schema uses UUID primary keys.");
  console.log("Master/configuration data was preserved.");
}

main()
  .catch((error) => {
    console.error("Failed to clear test transaction data.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
