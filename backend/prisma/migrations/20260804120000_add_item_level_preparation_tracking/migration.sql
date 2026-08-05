-- Add item-level preparation tracking without changing existing item cancellation status.
CREATE TYPE "ItemPreparationStatus" AS ENUM ('PENDING', 'PREPARING', 'PREPARED', 'SERVED');

ALTER TABLE "order_items"
  ADD COLUMN "item_status" "ItemPreparationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "prepared_at" TIMESTAMP(3),
  ADD COLUMN "served_at" TIMESTAMP(3),
  ADD COLUMN "prepared_by_id" TEXT,
  ADD COLUMN "served_by_id" TEXT;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_prepared_by_id_fkey"
  FOREIGN KEY ("prepared_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_served_by_id_fkey"
  FOREIGN KEY ("served_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "order_items_orderId_item_status_idx" ON "order_items"("orderId", "item_status");
CREATE INDEX "order_items_item_status_idx" ON "order_items"("item_status");
CREATE INDEX "order_items_prepared_by_id_idx" ON "order_items"("prepared_by_id");
CREATE INDEX "order_items_served_by_id_idx" ON "order_items"("served_by_id");
