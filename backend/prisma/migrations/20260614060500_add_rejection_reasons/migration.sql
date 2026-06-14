-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "rejectionReason" TEXT;
