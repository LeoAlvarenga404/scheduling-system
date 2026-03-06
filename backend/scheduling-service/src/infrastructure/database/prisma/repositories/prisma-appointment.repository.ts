import { Injectable } from "@nestjs/common";
import {
  AppointmentStatus as PrismaAppointmentStatus,
  Prisma,
} from "@prisma/client";
import type { SchedulingConflictType } from "src/domain/core/types/scheduling-conflict.types";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import type {
  AppointmentConflictCheckParams,
  AppointmentConflictResult,
  ListAppointmentsFilters,
} from "src/domain/repositories/appointment.repository.types";
import {
  PrismaAppointmentMapper,
  prismaAppointmentInclude,
} from "../mappers/prisma-appointment.mapper";
import { PrismaService } from "../prisma.service";

const ACTIVE_STATUS: PrismaAppointmentStatus[] = [
  PrismaAppointmentStatus.HOLD,
  PrismaAppointmentStatus.CONFIRMED,
];

type PrismaDbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(appointment: Appointment): Promise<void> {
    if (appointment.version === 0) {
      await this.prisma.$transaction(async (tx) => {
        await this.persistAppointment(tx, appointment);
      });

      return;
    }

    const previousVersion = appointment.version - 1;

    await this.prisma.$transaction(async (tx) => {
      const updatedAppointment = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          tenantId: appointment.tenantId,
          version: previousVersion,
        },
        data: PrismaAppointmentMapper.toPersistenceUpdate(appointment),
      });

      if (updatedAppointment.count === 0) {
        throw new Error(
          `Concurrent update detected for appointment ${appointment.id}.`,
        );
      }

      await this.replaceParticipants(tx, appointment);
    });
  }

  async createIfNoConflicts(
    appointment: Appointment,
  ): Promise<SchedulingConflictType | null> {
    return this.prisma.$transaction(async (tx) => {
      const conflictResult = await this.findConflictsWithClient(tx, {
        tenantId: appointment.tenantId,
        roomId: appointment.roomId,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        professionalIds: appointment.involvedProfessionalIds,
      });

      if (conflictResult.roomConflict) {
        return "CONFLICT_ROOM";
      }

      if (conflictResult.professionalConflict) {
        return "CONFLICT_PROFESSIONAL";
      }

      await this.persistAppointment(tx, appointment);

      return null;
    });
  }

  async findById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId,
      },
      include: prismaAppointmentInclude,
    });

    return appointment ? PrismaAppointmentMapper.toDomain(appointment) : null;
  }

  async findByExternalRef(
    externalRef: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        externalRef,
      },
      include: prismaAppointmentInclude,
    });

    return appointment ? PrismaAppointmentMapper.toDomain(appointment) : null;
  }

  async findByCreationIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        creationIdempotencyKey: idempotencyKey,
      },
      include: prismaAppointmentInclude,
    });

    return appointment ? PrismaAppointmentMapper.toDomain(appointment) : null;
  }

  async findByPaymentConfirmationKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        paymentConfirmationKey: idempotencyKey,
      },
      include: prismaAppointmentInclude,
    });

    return appointment ? PrismaAppointmentMapper.toDomain(appointment) : null;
  }

  async findConflictingAppointments(
    params: AppointmentConflictCheckParams,
  ): Promise<AppointmentConflictResult> {
    return this.findConflictsWithClient(this.prisma, params);
  }

  async listExpiredHolds(now: Date, tenantId?: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: PrismaAppointmentStatus.HOLD,
        holdExpiresAt: {
          lte: now,
        },
        ...(tenantId ? { tenantId } : {}),
      },
      include: prismaAppointmentInclude,
      orderBy: {
        startAt: "asc",
      },
    });

    return appointments.map(PrismaAppointmentMapper.toDomain);
  }

  async list({
    tenantId,
    dateFrom,
    dateTo,
    roomId,
    responsibleProfessionalId,
    participantProfessionalId,
    status,
  }: ListAppointmentsFilters): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(dateFrom
          ? {
              endAt: {
                gt: dateFrom,
              },
            }
          : {}),
        ...(dateTo
          ? {
              startAt: {
                lt: dateTo,
              },
            }
          : {}),
        ...(roomId ? { roomId } : {}),
        ...(responsibleProfessionalId ? { responsibleProfessionalId } : {}),
        ...(participantProfessionalId
          ? {
              participants: {
                some: {
                  professionalId: participantProfessionalId,
                },
              },
            }
          : {}),
        ...(status ? { status: status as PrismaAppointmentStatus } : {}),
      },
      include: prismaAppointmentInclude,
      orderBy: {
        startAt: "asc",
      },
    });

    return appointments.map(PrismaAppointmentMapper.toDomain);
  }

  private async findConflictsWithClient(
    client: PrismaDbClient,
    {
      tenantId,
      roomId,
      startAt,
      endAt,
      professionalIds,
      excludeAppointmentId,
    }: AppointmentConflictCheckParams,
  ): Promise<AppointmentConflictResult> {
    const overlapWhere: Prisma.AppointmentWhereInput = {
      tenantId,
      status: {
        in: ACTIVE_STATUS,
      },
      startAt: {
        lt: endAt,
      },
      endAt: {
        gt: startAt,
      },
      ...(excludeAppointmentId
        ? {
            id: {
              not: excludeAppointmentId,
            },
          }
        : {}),
    };

    const roomConflict = await client.appointment.findFirst({
      where: {
        ...overlapWhere,
        roomId,
      },
      include: prismaAppointmentInclude,
      orderBy: {
        startAt: "asc",
      },
    });

    const uniqueProfessionalIds = Array.from(
      new Set(professionalIds.filter(Boolean)),
    );

    const professionalConflict =
      uniqueProfessionalIds.length === 0
        ? null
        : await client.appointment.findFirst({
            where: {
              ...overlapWhere,
              OR: [
                {
                  responsibleProfessionalId: {
                    in: uniqueProfessionalIds,
                  },
                },
                {
                  participants: {
                    some: {
                      professionalId: {
                        in: uniqueProfessionalIds,
                      },
                    },
                  },
                },
              ],
            },
            include: prismaAppointmentInclude,
            orderBy: {
              startAt: "asc",
            },
          });

    return {
      roomConflict: roomConflict
        ? PrismaAppointmentMapper.toDomain(roomConflict)
        : null,
      professionalConflict: professionalConflict
        ? PrismaAppointmentMapper.toDomain(professionalConflict)
        : null,
    };
  }

  private async persistAppointment(
    client: PrismaDbClient,
    appointment: Appointment,
  ): Promise<void> {
    await client.appointment.create({
      data: PrismaAppointmentMapper.toPersistenceCreate(appointment),
    });

    await this.replaceParticipants(client, appointment);
  }

  private async replaceParticipants(
    client: PrismaDbClient,
    appointment: Appointment,
  ): Promise<void> {
    await client.appointmentParticipant.deleteMany({
      where: {
        appointmentId: appointment.id,
      },
    });

    const participantRows = PrismaAppointmentMapper.toParticipantRows(appointment);

    if (participantRows.length > 0) {
      await client.appointmentParticipant.createMany({
        data: participantRows,
        skipDuplicates: true,
      });
    }
  }
}
