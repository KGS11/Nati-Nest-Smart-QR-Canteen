-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "specialNotes" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
