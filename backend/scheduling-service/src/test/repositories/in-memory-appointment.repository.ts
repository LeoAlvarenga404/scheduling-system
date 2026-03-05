import { Appointment } from "src/domain/entities/appointment";
import {
  AppointmentRepository,
} from "src/domain/repositories/appointment.repository";
import type {
  AppointmentConflictCheckParams,
  AppointmentConflictResult,
  FindIdempotencyRecordParams,
  IdempotencyRecord,
  ListAppointmentsFilters,
} from "src/domain/repositories/appointment.repository.types";
import type { SchedulingConflictType } from "src/domain/core/types/scheduling-conflict.types";

const ACTIVE_STATUSES: ReadonlySet<string> = new Set(["HOLD", "CONFIRMED"]);

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public items: Appointment[] = [];
  public idempotencyRecords: IdempotencyRecord[] = [];

  async createAppointment(appointment: Appointment): Promise<void> {
    this.items.push(appointment);
  }

  async createAppointmentIfNoConflicts(
    appointment: Appointment,
  ): Promise<SchedulingConflictType | null> {
    const conflicts = await this.findConflicts({
      tenantId: appointment.tenantId.value,
      roomId: appointment.roomId.value,
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

  async updateAppointment(appointment: Appointment): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.toString() === appointment.id.toString() &&
        item.tenantId.value === appointment.tenantId.value,
    );

    if (index >= 0) {
      this.items[index] = appointment;
    }
  }

  async getAppointmentById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    return (
      this.items.find(
        (appointment) =>
          appointment.id.toString() === appointmentId &&
          appointment.tenantId.value === tenantId,
      ) ?? null
    );
  }

  async getAppointmentByExternalRef(
    externalRef: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    return (
      this.items.find(
        (appointment) =>
          appointment.externalRef === externalRef &&
          appointment.tenantId.value === tenantId,
      ) ?? null
    );
  }

  async findConflicts({
    tenantId,
    roomId,
    startAt,
    endAt,
    professionalIds,
    excludeAppointmentId,
  }: AppointmentConflictCheckParams): Promise<AppointmentConflictResult> {
    const filteredAppointments = this.items.filter((appointment) => {
      if (appointment.tenantId.value !== tenantId) {
        return false;
      }

      if (excludeAppointmentId) {
        return appointment.id.toString() !== excludeAppointmentId;
      }

      return true;
    });

    const overlappingAppointments = filteredAppointments.filter(
      (appointment) => {
        if (!ACTIVE_STATUSES.has(appointment.status.value)) {
          return false;
        }

        return InMemoryAppointmentRepository.hasOverlap({
          startAtA: appointment.startAt,
          endAtA: appointment.endAt,
          startAtB: startAt,
          endAtB: endAt,
        });
      },
    );

    const roomConflict =
      overlappingAppointments.find(
        (appointment) => appointment.roomId.value === roomId,
      ) ?? null;

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
      if (appointment.status.value !== "HOLD") {
        return false;
      }

      if (tenantId && appointment.tenantId.value !== tenantId) {
        return false;
      }

      return Boolean(
        appointment.holdExpiresAt &&
          appointment.holdExpiresAt.getTime() <= now.getTime(),
      );
    });
  }

  async listAppointments({
    tenantId,
    dateFrom,
    dateTo,
    roomId,
    responsibleProfessionalId,
    participantProfessionalId,
    status,
  }: ListAppointmentsFilters): Promise<Appointment[]> {
    return this.items
      .filter((appointment) => appointment.tenantId.value === tenantId)
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

        return appointment.roomId.value === roomId;
      })
      .filter((appointment) => {
        if (!responsibleProfessionalId) {
          return true;
        }

        return (
          appointment.responsibleProfessionalId.value ===
          responsibleProfessionalId
        );
      })
      .filter((appointment) => {
        if (!participantProfessionalId) {
          return true;
        }

        return (
          appointment.participantProfessionalIds?.includes(
            participantProfessionalId,
          ) ?? false
        );
      })
      .filter((appointment) => {
        if (!status) {
          return true;
        }

        return appointment.status.value === status;
      })
      .sort((leftAppointment, rightAppointment) => {
        return leftAppointment.startAt.getTime() - rightAppointment.startAt.getTime();
      });
  }

  async findIdempotencyRecord<TResponse = unknown>({
    tenantId,
    key,
    operation,
  }: FindIdempotencyRecordParams): Promise<IdempotencyRecord<TResponse> | null> {
    return (
      (this.idempotencyRecords.find(
        (record) =>
          record.tenantId === tenantId &&
          record.key === key &&
          record.operation === operation,
      ) as IdempotencyRecord<TResponse> | undefined) ?? null
    );
  }

  async saveIdempotencyRecord<TResponse = unknown>(
    record: IdempotencyRecord<TResponse>,
  ): Promise<void> {
    const existingRecordIndex = this.idempotencyRecords.findIndex(
      (existingRecord) =>
        existingRecord.tenantId === record.tenantId &&
        existingRecord.key === record.key &&
        existingRecord.operation === record.operation,
    );

    if (existingRecordIndex >= 0) {
      this.idempotencyRecords[existingRecordIndex] = record;
      return;
    }

    this.idempotencyRecords.push(record);
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
    return startAtA.getTime() < endAtB.getTime() && startAtB.getTime() < endAtA.getTime();
  }
}
