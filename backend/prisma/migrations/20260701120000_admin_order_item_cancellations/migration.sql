ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_ADMIN';

ALTER TABLE "order_items"
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancellationNotes" TEXT,
  ADD COLUMN "originalAmount" DECIMAL(10,2);

CREATE TABLE "payment_adjustments" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REFUND_PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_items_cancelledById_idx" ON "order_items"("cancelledById");
CREATE INDEX "order_items_cancelledAt_idx" ON "order_items"("cancelledAt");
CREATE INDEX "payment_adjustments_paymentId_idx" ON "payment_adjustments"("paymentId");
CREATE INDEX "payment_adjustments_sessionId_idx" ON "payment_adjustments"("sessionId");
CREATE INDEX "payment_adjustments_orderItemId_idx" ON "payment_adjustments"("orderItemId");
CREATE INDEX "payment_adjustments_adminId_idx" ON "payment_adjustments"("adminId");
CREATE INDEX "payment_adjustments_status_createdAt_idx" ON "payment_adjustments"("status", "createdAt");
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_cancelledById_fkey"
  FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_adjustments"
  ADD CONSTRAINT "payment_adjustments_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_adjustments"
  ADD CONSTRAINT "payment_adjustments_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_adjustments"
  ADD CONSTRAINT "payment_adjustments_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_adjustments"
  ADD CONSTRAINT "payment_adjustments_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
