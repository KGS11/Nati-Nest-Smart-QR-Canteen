CREATE TYPE "CateringLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST');

CREATE TABLE "catering_leads" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "preferredContactTime" TEXT,
    "status" "CateringLeadStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catering_leads_sessionId_idx" ON "catering_leads"("sessionId");
CREATE INDEX "catering_leads_status_createdAt_idx" ON "catering_leads"("status", "createdAt");
CREATE INDEX "catering_leads_eventDate_idx" ON "catering_leads"("eventDate");

ALTER TABLE "catering_leads" ADD CONSTRAINT "catering_leads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
