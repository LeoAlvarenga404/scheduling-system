import { Prisma, type Appointment as PrismaAppointment } from "@prisma/client";
import { Appointment } from "src/domain/entities/appointment";
import type { AppointmentMetadata } from "src/domain/entities/appointment.types";

export const prismaAppointmentInclude = {
  participants: {
    orderBy: {
      professionalId: "asc",
    },
  },
} satisfies Prisma.AppointmentInclude;

export type PrismaAppointmentWithParticipants = Prisma.AppointmentGetPayload<{
  include: typeof prismaAppointmentInclude;
}>;

export class PrismaAppointmentMapper {
  static toDomain(appointment: PrismaAppointmentWithParticipants): Appointment {
    return Appointment.rehydrate({
      id: appointment.id,
      tenantId: appointment.tenantId,
      roomId: appointment.roomId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      responsibleProfessionalId: appointment.responsibleProfessionalId,
      participantProfessionalIds: appointment.participants.map(
        (participant) => participant.professionalId,
      ),
      customerId: appointment.customerId ?? undefined,
      holdExpiresAt: appointment.holdExpiresAt ?? undefined,
      externalRef: appointment.externalRef ?? undefined,
      paymentRef: appointment.paymentRef ?? undefined,
      paidAt: appointment.paidAt ?? undefined,
      creationIdempotencyKey: appointment.creationIdempotencyKey ?? undefined,
      paymentConfirmationKey: appointment.paymentConfirmationKey ?? undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      version: appointment.version,
      metadata: PrismaAppointmentMapper.toDomainMetadata(appointment.metadata),
    });
  }

  static toPersistenceCreate(
    appointment: Appointment,
  ): Prisma.AppointmentUncheckedCreateInput {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      roomId: appointment.roomId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      responsibleProfessionalId: appointment.responsibleProfessionalId,
      customerId: appointment.customerId ?? null,
      holdExpiresAt: appointment.holdExpiresAt ?? null,
      externalRef: appointment.externalRef ?? null,
      paymentRef: appointment.paymentRef ?? null,
      paidAt: appointment.paidAt ?? null,
      creationIdempotencyKey: appointment.creationIdempotencyKey ?? null,
      paymentConfirmationKey: appointment.paymentConfirmationKey ?? null,
      metadata: PrismaAppointmentMapper.toPersistenceMetadata(
        appointment.metadata,
      ),
      version: appointment.version,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  static toPersistenceUpdate(
    appointment: Appointment,
  ): Prisma.AppointmentUpdateManyMutationInput {
    return {
      roomId: appointment.roomId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      responsibleProfessionalId: appointment.responsibleProfessionalId,
      customerId: appointment.customerId ?? null,
      holdExpiresAt: appointment.holdExpiresAt ?? null,
      externalRef: appointment.externalRef ?? null,
      paymentRef: appointment.paymentRef ?? null,
      paidAt: appointment.paidAt ?? null,
      creationIdempotencyKey: appointment.creationIdempotencyKey ?? null,
      paymentConfirmationKey: appointment.paymentConfirmationKey ?? null,
      metadata: PrismaAppointmentMapper.toPersistenceMetadata(
        appointment.metadata,
      ),
      version: appointment.version,
      updatedAt: appointment.updatedAt,
    };
  }

  static toParticipantRows(
    appointment: Appointment,
  ): Prisma.AppointmentParticipantCreateManyInput[] {
    return (appointment.participantProfessionalIds ?? []).map(
      (professionalId) => ({
        appointmentId: appointment.id,
        professionalId,
      }),
    );
  }

  private static toPersistenceMetadata(
    metadata?: AppointmentMetadata,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!metadata) {
      return Prisma.DbNull;
    }

    return metadata as Prisma.InputJsonValue;
  }

  private static toDomainMetadata(
    metadata: PrismaAppointment["metadata"],
  ): AppointmentMetadata | undefined {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return undefined;
    }

    return metadata as AppointmentMetadata;
  }
}
