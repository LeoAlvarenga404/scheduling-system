import { AppointmentStatus as PrismaAppointmentStatus } from "@prisma/client";
import { makeAppointment } from "src/test/factories/make-appointment";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaService } from "../prisma.service";
import { PrismaAppointmentRepository } from "./prisma-appointment.repository";

interface PrismaMock {
  appointment: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    appointment: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  mock.$transaction.mockImplementation(async (callback: unknown) => {
    if (typeof callback === "function") {
      return callback(mock);
    }

    return callback;
  });

  return mock;
}

function toPersistenceAppointment(
  appointment: ReturnType<typeof makeAppointment>,
  overrides?: {
    creationIdempotencyKey?: string | null;
    paymentConfirmationKey?: string | null;
  },
) {
  return {
    id: appointment.id,
    tenantId: appointment.tenantId,
    roomId: appointment.roomId,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    status: appointment.status as PrismaAppointmentStatus,
    responsibleProfessionalId: appointment.responsibleProfessionalId,
    customerId: appointment.customerId ?? null,
    holdExpiresAt: appointment.holdExpiresAt ?? null,
    externalRef: appointment.externalRef ?? null,
    paymentRef: appointment.paymentRef ?? null,
    paidAt: appointment.paidAt ?? null,
    creationIdempotencyKey: overrides?.creationIdempotencyKey ?? null,
    paymentConfirmationKey: overrides?.paymentConfirmationKey ?? null,
    metadata: appointment.metadata ?? null,
    version: appointment.version,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    participants: (appointment.participantProfessionalIds ?? []).map(
      (professionalId) => ({
        appointmentId: appointment.id,
        professionalId,
        createdAt: appointment.createdAt,
      }),
    ),
  };
}

describe("PrismaAppointmentRepository", () => {
  let prismaMock: PrismaMock;
  let repository: PrismaAppointmentRepository;

  beforeEach(() => {
    prismaMock = makePrismaMock();
    repository = new PrismaAppointmentRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  it("should lookup appointments by creation idempotency key", async () => {
    const appointment = makeAppointment();

    prismaMock.appointment.findFirst.mockResolvedValue(
      toPersistenceAppointment(appointment, {
        creationIdempotencyKey: "create-123",
      }),
    );

    const found = await repository.findByCreationIdempotencyKey(
      appointment.tenantId,
      "create-123",
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(appointment.id);
    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: appointment.tenantId,
          creationIdempotencyKey: "create-123",
        },
      }),
    );
  });

  it("should lookup appointments by payment confirmation key", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    prismaMock.appointment.findFirst.mockResolvedValue(
      toPersistenceAppointment(appointment, {
        paymentConfirmationKey: "payment-123",
      }),
    );

    const found = await repository.findByPaymentConfirmationKey(
      appointment.tenantId,
      "payment-123",
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(appointment.id);
    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: appointment.tenantId,
          paymentConfirmationKey: "payment-123",
        },
      }),
    );
  });
});
