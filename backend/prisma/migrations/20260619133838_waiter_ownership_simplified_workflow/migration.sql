-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedKitchenId" TEXT,
ADD COLUMN     "assignedKitchenName" TEXT,
ADD COLUMN     "assignedWaiterId" TEXT,
ADD COLUMN     "assignedWaiterName" TEXT,
ADD COLUMN     "deliveredBy" TEXT;

-- AlterTable
ALTER TABLE "table_sessions" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedWaiterId" TEXT;

-- CreateTable
CREATE TABLE "order_assignment_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiter_assignment_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "waiter_assignment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_assignment_history_orderId_idx" ON "order_assignment_history"("orderId");

-- CreateIndex
CREATE INDEX "order_assignment_history_staffId_idx" ON "order_assignment_history"("staffId");

-- CreateIndex
CREATE INDEX "waiter_assignment_requests_sessionId_idx" ON "waiter_assignment_requests"("sessionId");

-- CreateIndex
CREATE INDEX "waiter_assignment_requests_status_idx" ON "waiter_assignment_requests"("status");

-- CreateIndex
CREATE INDEX "orders_assignedKitchenId_idx" ON "orders"("assignedKitchenId");

-- CreateIndex
CREATE INDEX "orders_assignedWaiterId_idx" ON "orders"("assignedWaiterId");

-- CreateIndex
CREATE INDEX "table_sessions_assignedWaiterId_idx" ON "table_sessions"("assignedWaiterId");

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_assignedWaiterId_fkey" FOREIGN KEY ("assignedWaiterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedKitchenId_fkey" FOREIGN KEY ("assignedKitchenId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedWaiterId_fkey" FOREIGN KEY ("assignedWaiterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignment_history" ADD CONSTRAINT "order_assignment_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignment_history" ADD CONSTRAINT "order_assignment_history_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_assignment_requests" ADD CONSTRAINT "waiter_assignment_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_assignment_requests" ADD CONSTRAINT "waiter_assignment_requests_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
