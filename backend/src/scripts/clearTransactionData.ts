import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaClient, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

type CleanupReport = Record<string, number>;

const transactionAuditEntityTypes = [
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
];

const cleanedTables = [
  "audit_logs (only order/session/payment-related rows)",
  "payment_adjustments",
  "waiter_assignment_requests",
  "assistance_requests",
  "feedback",
  "payments",
  "order_assignment_history",
  "order_items",
  "orders",
  "table_sessions",
  "restaurant_tables (status reset from OCCUPIED to AVAILABLE only)",
];

const preservedTables = [
  "users",
  "refresh_tokens",
  "menu_categories",
  "menu_items",
  "restaurant_tables",
  "settings",
  "daily_menu",
  "catering_leads (preserved; detached from deleted sessions)",
];

const printList = (title: string, values: string[]) => {
  console.log(`\n${title}`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
};

const printReport = (report: CleanupReport) => {
  console.log("\nTransaction cleanup complete:");
  for (const [label, count] of Object.entries(report)) {
    console.log(`${label}: ${count}`);
  }
};

const hasConfirmedFlag = () =>
  process.argv.includes("--confirm") || process.env.CONFIRM_TRANSACTION_CLEANUP === "true";

const requireConfirmation = async () => {
  if (hasConfirmedFlag()) return;

  printList("Tables/data that will be cleaned", cleanedTables);
  printList("Tables/data that will be preserved", preservedTables);

  console.log("\nThis will permanently delete production transaction/test data.");
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question('Type "CLEAR TRANSACTIONS" to continue: ');
    if (answer.trim() !== "CLEAR TRANSACTIONS") {
      console.log("Cleanup cancelled. No data was changed.");
      process.exit(1);
    }
  } finally {
    rl.close();
  }
};

async function clearTransactionData() {
  return prisma.$transaction(async (tx) => {
    const deleted: CleanupReport = {};

    deleted.orderRelatedAuditLogs = (
      await tx.auditLog.deleteMany({
        where: {
          entityType: { in: transactionAuditEntityTypes },
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
}

async function main() {
  await requireConfirmation();
  const report = await clearTransactionData();

  printReport(report);
  printList("Preserved master/configuration data", preservedTables);
  console.log("\nAuto-increment reset: not applicable. This schema uses UUID primary keys.");
}

main()
  .catch((error) => {
    console.error("Failed to clear transaction data.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
