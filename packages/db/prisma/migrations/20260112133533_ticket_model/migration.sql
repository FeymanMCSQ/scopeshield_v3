-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'pending',
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "platform" TEXT NOT NULL,
    "evidenceText" TEXT NOT NULL,
    "evidenceAt" TIMESTAMP(3) NOT NULL,
    "evidenceUrl" TEXT,
    "assetUrl" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_ownerUserId_createdAt_idx" ON "Ticket"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
