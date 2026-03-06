import type { Appointment } from "../entities/appointment";
import type { SchedulingConflictType } from "../core/types/scheduling-conflict.types";
import type {
  AppointmentConflictCheckParams,
  AppointmentConflictResult,
  ListAppointmentsFilters,
} from "./appointment.repository.types";

export abstract class AppointmentRepository {
  abstract save(appointment: Appointment): Promise<void>;
  abstract createIfNoConflicts(
    appointment: Appointment,
  ): Promise<SchedulingConflictType | null>;
  abstract findById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null>;
  abstract findByExternalRef(
    externalRef: string,
    tenantId: string,
  ): Promise<Appointment | null>;
  abstract findByCreationIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Appointment | null>;
  abstract findByPaymentConfirmationKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Appointment | null>;
  abstract findConflictingAppointments(
    params: AppointmentConflictCheckParams,
  ): Promise<AppointmentConflictResult>;
  abstract listExpiredHolds(
    now: Date,
    tenantId?: string,
  ): Promise<Appointment[]>;
  abstract list(filters: ListAppointmentsFilters): Promise<Appointment[]>;
}
