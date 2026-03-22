/*
  Warnings:

  - Added the required column `amount` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."appointments" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."outbox_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processed_events" (
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE INDEX "outbox_events_publishedAt_idx" ON "public"."outbox_events"("publishedAt");
