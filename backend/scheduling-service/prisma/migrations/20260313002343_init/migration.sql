-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('HOLD', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "responsibleProfessionalId" TEXT NOT NULL,
    "customerId" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "externalRef" TEXT,
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_participants" (
    "appointmentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_participants_pkey" PRIMARY KEY ("appointmentId","professionalId")
);

-- CreateIndex
CREATE INDEX "appointments_tenantId_startAt_idx" ON "appointments"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_roomId_startAt_endAt_idx" ON "appointments"("tenantId", "roomId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_responsibleProfessionalId_startAt_end_idx" ON "appointments"("tenantId", "responsibleProfessionalId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_status_holdExpiresAt_idx" ON "appointments"("tenantId", "status", "holdExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_tenantId_externalRef_key" ON "appointments"("tenantId", "externalRef");

-- CreateIndex
CREATE INDEX "appointment_participants_professionalId_idx" ON "appointment_participants"("professionalId");

-- AddForeignKey
ALTER TABLE "appointment_participants" ADD CONSTRAINT "appointment_participants_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
