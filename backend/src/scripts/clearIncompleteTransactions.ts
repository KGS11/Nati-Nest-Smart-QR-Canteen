import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  AssistanceStatus,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  SessionStatus,
  TableStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type CleanupReport = Record<string, number>;

const completeOrderStatuses = [OrderStatus.PAID, OrderStatus.CANCELLED];

const cleanedData = [
  "active table_sessions",
  "sessions with pending payments",
  "sessions with orders not PAID or CANCELLED",
  "waiter_assignment_requests linked to those sessions",
  "assistance_requests linked to those sessions",
  "feedback linked to those sessions",
  "payments linked to those sessions",
  "payment_adjustments linked to those sessions",
  "order_assignment_history linked to those orders",
  "order_items linked to those orders",
  "orders linked to those sessions",
  "audit_logs linked to deleted transaction records",
  "restaurant_tables linked to deleted sessions reset to AVAILABLE",
];

const preservedData = [
  "users",
  "refresh_tokens",
  "menu_categories",
  "menu_items",
  "restaurant_tables",
  "settings",
  "daily_menu",
  "payment QR images",
  "closed/paid transaction history",
  "catering_leads (preserved; detached from deleted sessions)",
];

const hasConfirmedFlag = () =>
  process.argv.includes("--confirm") || process.env.CONFIRM_INCOMPLETE_TRANSACTION_CLEANUP === "true";

const printList = (title: string, values: string[]) => {
  console.log(`\n${title}`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
};

const requireConfirmation = async () => {
  if (hasConfirmedFlag()) return;

  printList("Incomplete transaction data that will be cleaned", cleanedData);
  printList("Data that will be preserved", preservedData);

  console.log("\nThis will permanently delete only currently incomplete/live transaction data.");
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question('Type "CLEAR INCOMPLETE" to continue: ');
    if (answer.trim() !== "CLEAR INCOMPLETE") {
      console.log("Cleanup cancelled. No data was changed.");
      process.exit(1);
    }
  } finally {
    rl.close();
  }
};

const printReport = (report: CleanupReport) => {
  console.log("\nIncomplete transaction cleanup complete:");
  for (const [label, count] of Object.entries(report)) {
    console.log(`${label}: ${count}`);
  }
};

async function findIncompleteSessionIds() {
  const sessions = await prisma.tableSession.findMany({
    where: {
      OR: [
        { status: SessionStatus.ACTIVE },
        { payment: { is: { status: PaymentStatus.PENDING } } },
        { assistanceRequests: { some: { status: AssistanceStatus.PENDING } } },
        { waiterAssignmentRequests: { some: { status: "PENDING" } } },
        { orders: { some: { status: { notIn: completeOrderStatuses } } } },
      ],
    },
    select: {
      id: true,
      tableId: true,
    },
  });

  return {
    sessionIds: sessions.map((session) => session.id),
    tableIds: [...new Set(sessions.map((session) => session.tableId))],
  };
}

async function clearIncompleteTransactions() {
  const { sessionIds, tableIds } = await findIncompleteSessionIds();

  if (!sessionIds.length) {
    return {
      incompleteSessionsFound: 0,
      orderRelatedAuditLogs: 0,
      paymentAdjustments: 0,
      waiterAssignmentRequests: 0,
      assistanceRequests: 0,
      feedback: 0,
      cateringLeadsDetachedFromSessions: 0,
      payments: 0,
      orderAssignmentHistory: 0,
      orderItems: 0,
      orders: 0,
      tableSessions: 0,
      tablesResetToAvailable: 0,
    };
  }

  return prisma.$transaction(
    async (tx) => {
      const report: CleanupReport = {
        incompleteSessionsFound: sessionIds.length,
      };

    const orders = await tx.order.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    const orderItems = orderIds.length
      ? await tx.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { id: true },
        })
      : [];
    const orderItemIds = orderItems.map((item) => item.id);

    const payments = await tx.payment.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { id: true },
    });
    const paymentIds = payments.map((payment) => payment.id);

    report.orderRelatedAuditLogs = (
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { entityType: { in: ["table_session", "table_sessions"] }, entityId: { in: sessionIds } },
            ...(orderIds.length
              ? [{ entityType: { in: ["order", "orders"] }, entityId: { in: orderIds } }]
              : []),
            ...(orderItemIds.length
              ? [{ entityType: { in: ["order_item", "order_items"] }, entityId: { in: orderItemIds } }]
              : []),
            ...(paymentIds.length
              ? [{ entityType: { in: ["payment", "payments"] }, entityId: { in: paymentIds } }]
              : []),
          ],
        },
      })
    ).count;

    report.paymentAdjustments = (
      await tx.paymentAdjustment.deleteMany({
        where: {
          OR: [
            { sessionId: { in: sessionIds } },
            ...(paymentIds.length ? [{ paymentId: { in: paymentIds } }] : []),
            ...(orderItemIds.length ? [{ orderItemId: { in: orderItemIds } }] : []),
          ],
        },
      })
    ).count;

    report.waiterAssignmentRequests = (
      await tx.waiterAssignmentRequest.deleteMany({ where: { sessionId: { in: sessionIds } } })
    ).count;
    report.assistanceRequests = (
      await tx.assistanceRequest.deleteMany({ where: { sessionId: { in: sessionIds } } })
    ).count;
    report.feedback = (await tx.feedback.deleteMany({ where: { sessionId: { in: sessionIds } } })).count;
    report.cateringLeadsDetachedFromSessions = (
      await tx.cateringLead.updateMany({
        where: { sessionId: { in: sessionIds } },
        data: { sessionId: null },
      })
    ).count;
    report.payments = (await tx.payment.deleteMany({ where: { sessionId: { in: sessionIds } } })).count;
    report.orderAssignmentHistory = orderIds.length
      ? (await tx.orderAssignmentHistory.deleteMany({ where: { orderId: { in: orderIds } } })).count
      : 0;
    report.orderItems = orderIds.length
      ? (await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })).count
      : 0;
    report.orders = (await tx.order.deleteMany({ where: { sessionId: { in: sessionIds } } })).count;
    report.tableSessions = (await tx.tableSession.deleteMany({ where: { id: { in: sessionIds } } })).count;
    report.tablesResetToAvailable = tableIds.length
      ? (
          await tx.restaurantTable.updateMany({
            where: { id: { in: tableIds }, status: TableStatus.OCCUPIED },
            data: { status: TableStatus.AVAILABLE },
          })
        ).count
      : 0;

      return report;
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}

async function main() {
  await requireConfirmation();
  const report = await clearIncompleteTransactions();

  printReport(report);
  printList("Preserved data", preservedData);
  console.log("\nAuto-increment reset: not applicable. This schema uses UUID primary keys.");
}

main()
  .catch((error) => {
    console.error("Failed to clear incomplete transactions.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
