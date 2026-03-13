import type { SchedulingConflictType } from "src/domain/core/types/scheduling-conflict.types";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import type {
  AppointmentConflictCheckParams,
  AppointmentConflictResult,
  ListAppointmentsFilters,
} from "src/domain/repositories/appointment.repository.types";

const ACTIVE_STATUS: ReadonlySet<string> = new Set(["HOLD", "CONFIRMED"]);

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public items: Appointment[] = [];

  async save(appointment: Appointment): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id === appointment.id && item.tenantId === appointment.tenantId,
    );

    if (index >= 0) {
      this.items[index] = appointment;
      return;
    }

    this.items.push(appointment);
  }

  async createIfNoConflicts(
    appointment: Appointment,
  ): Promise<SchedulingConflictType | null> {
    const conflicts = await this.findConflictingAppointments({
      tenantId: appointment.tenantId,
      roomId: appointment.roomId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      professionalIds: appointment.involvedProfessionalIds,
    });

    if (conflicts.roomConflict) {
      return "CONFLICT_ROOM";
    }

    if (conflicts.professionalConflict) {
      return "CONFLICT_PROFESSIONAL";
    }

    this.items.push(appointment);

    return null;
  }

  async findById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    return (
      this.items.find(
        (appointment) =>
          appointment.id === appointmentId && appointment.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByExternalRef(
    externalRef: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    return (
      this.items.find(
        (appointment) =>
          appointment.externalRef === externalRef && appointment.tenantId === tenantId,
        ) ?? null
    );
  }

  async findConflictingAppointments({
    tenantId,
    roomId,
    startAt,
    endAt,
    professionalIds,
    excludeAppointmentId,
  }: AppointmentConflictCheckParams): Promise<AppointmentConflictResult> {
    const filteredAppointments = this.items.filter((appointment) => {
      if (appointment.tenantId !== tenantId) {
        return false;
      }

      if (excludeAppointmentId) {
        return appointment.id !== excludeAppointmentId;
      }

      return true;
    });

    const overlappingAppointments = filteredAppointments.filter((appointment) => {
      if (!ACTIVE_STATUS.has(appointment.status)) {
        return false;
      }

      return InMemoryAppointmentRepository.hasOverlap({
        startAtA: appointment.startAt,
        endAtA: appointment.endAt,
        startAtB: startAt,
        endAtB: endAt,
      });
    });

    const roomConflict =
      overlappingAppointments.find((appointment) => appointment.roomId === roomId) ??
      null;

    const professionalIdsSet = new Set(professionalIds);
    const professionalConflict =
      overlappingAppointments.find((appointment) =>
        appointment.involvedProfessionalIds.some((professionalId) =>
          professionalIdsSet.has(professionalId),
        ),
      ) ?? null;

    return {
      roomConflict,
      professionalConflict,
    };
  }

  async listExpiredHolds(now: Date, tenantId?: string): Promise<Appointment[]> {
    return this.items.filter((appointment) => {
      if (appointment.status !== "HOLD") {
        return false;
      }

      if (tenantId && appointment.tenantId !== tenantId) {
        return false;
      }

      return Boolean(
        appointment.holdExpiresAt &&
          appointment.holdExpiresAt.getTime() <= now.getTime(),
      );
    });
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
    return this.items
      .filter((appointment) => appointment.tenantId === tenantId)
      .filter((appointment) => {
        if (!dateFrom) {
          return true;
        }

        return appointment.endAt.getTime() > dateFrom.getTime();
      })
      .filter((appointment) => {
        if (!dateTo) {
          return true;
        }

        return appointment.startAt.getTime() < dateTo.getTime();
      })
      .filter((appointment) => {
        if (!roomId) {
          return true;
        }

        return appointment.roomId === roomId;
      })
      .filter((appointment) => {
        if (!responsibleProfessionalId) {
          return true;
        }

        return appointment.responsibleProfessionalId === responsibleProfessionalId;
      })
      .filter((appointment) => {
        if (!participantProfessionalId) {
          return true;
        }

        return (
          appointment.participantProfessionalIds?.includes(participantProfessionalId) ??
          false
        );
      })
      .filter((appointment) => {
        if (!status) {
          return true;
        }

        return appointment.status === status;
      })
      .sort(
        (leftAppointment, rightAppointment) =>
          leftAppointment.startAt.getTime() - rightAppointment.startAt.getTime(),
      );
  }

  private static hasOverlap({
    startAtA,
    endAtA,
    startAtB,
    endAtB,
  }: {
    startAtA: Date;
    endAtA: Date;
    startAtB: Date;
    endAtB: Date;
  }): boolean {
    return (
      startAtA.getTime() < endAtB.getTime() &&
      startAtB.getTime() < endAtA.getTime()
    );
  }
}

