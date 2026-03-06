import { AppointmentStatus as PrismaAppointmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { PrismaAppointmentWithParticipants } from "./prisma-appointment.mapper";
import { PrismaAppointmentMapper } from "./prisma-appointment.mapper";

describe("PrismaAppointmentMapper", () => {
  it("should rehydrate a domain appointment without emitting creation events", () => {
    const rawAppointment: PrismaAppointmentWithParticipants = {
      id: "appointment-01",
      tenantId: "tenant-01",
      roomId: "room-101",
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      status: PrismaAppointmentStatus.HOLD,
      responsibleProfessionalId: "prof-10",
      customerId: "customer-01",
      holdExpiresAt: new Date("2026-03-10T13:10:00.000Z"),
      externalRef: "ext-01",
      paymentRef: null,
      paidAt: null,
      creationIdempotencyKey: null,
      paymentConfirmationKey: null,
      metadata: {
        source: "spec",
      },
      version: 2,
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
      updatedAt: new Date("2026-03-10T12:05:00.000Z"),
      participants: [
        {
          appointmentId: "appointment-01",
          professionalId: "prof-11",
          createdAt: new Date("2026-03-10T12:00:00.000Z"),
        },
      ],
    };

    const appointment = PrismaAppointmentMapper.toDomain(rawAppointment);

    expect(appointment.id).toBe("appointment-01");
    expect(appointment.tenantId).toBe("tenant-01");
    expect(appointment.status).toBe("HOLD");
    expect(appointment.participantProfessionalIds).toEqual(["prof-11"]);
    expect(appointment.getDomainEvents()).toHaveLength(0);
  });
});

