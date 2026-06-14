-- CreateEnum
CREATE TYPE "DailyMenuRemovalReason" AS ENUM ('OUT_OF_STOCK', 'INGREDIENT_FINISHED', 'MACHINE_PROBLEM', 'KITCHEN_CLOSED', 'OTHER');

-- AlterTable
ALTER TABLE "daily_menu" ADD COLUMN     "removalReason" TEXT,
ADD COLUMN     "removalReasonType" "DailyMenuRemovalReason";

-- CreateIndex
CREATE INDEX "order_items_status_idx" ON "order_items"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_status_idx" ON "order_items"("orderId", "status");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "table_sessions_status_idx" ON "table_sessions"("status");
