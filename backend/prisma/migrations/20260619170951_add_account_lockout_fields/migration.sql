-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFailedAttempt" TIMESTAMP(3),
ADD COLUMN     "lockUntil" TIMESTAMP(3);
