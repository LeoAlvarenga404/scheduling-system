import type { Appointment } from "../entities/appointment";
import type { SchedulingConflictType } from "../core/types/scheduling-conflict.types";
import type {
  AppointmentConflictCheckParams,
  AppointmentConflictResult,
  FindIdempotencyRecordParams,
  IdempotencyRecord,
  ListAppointmentsFilters,
} from "./appointment.repository.types";

export abstract class AppointmentRepository {
  abstract createAppointment(appointment: Appointment): Promise<void>;
  abstract createAppointmentIfNoConflicts(
    appointment: Appointment,
  ): Promise<SchedulingConflictType | null>;
  abstract updateAppointment(appointment: Appointment): Promise<void>;
  abstract getAppointmentById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null>;
  abstract getAppointmentByExternalRef(
    externalRef: string,
    tenantId: string,
  ): Promise<Appointment | null>;
  abstract findConflicts(
    params: AppointmentConflictCheckParams,
  ): Promise<AppointmentConflictResult>;
  abstract listExpiredHolds(
    now: Date,
    tenantId?: string,
  ): Promise<Appointment[]>;
  abstract listAppointments(
    filters: ListAppointmentsFilters,
  ): Promise<Appointment[]>;
  abstract findIdempotencyRecord<TResponse = unknown>(
    params: FindIdempotencyRecordParams,
  ): Promise<IdempotencyRecord<TResponse> | null>;
  abstract saveIdempotencyRecord<TResponse = unknown>(
    record: IdempotencyRecord<TResponse>,
  ): Promise<void>;
}
