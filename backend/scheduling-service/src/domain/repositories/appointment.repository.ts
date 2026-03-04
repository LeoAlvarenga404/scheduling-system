import { Appointment } from "../entities/appointment";
import { SchedulingConflictType } from "../errors/scheduling-conflicts.error";
import { Status } from "../value-objects/appointment-status.vo";

export interface AppointmentConflictCheckParams {
  tenantId: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  professionalIds: string[];
  excludeAppointmentId?: string;
}

export interface AppointmentConflictResult {
  roomConflict: Appointment | null;
  professionalConflict: Appointment | null;
}

export interface ListAppointmentsFilters {
  tenantId: string;
  dateFrom?: Date;
  dateTo?: Date;
  roomId?: string;
  responsibleProfessionalId?: string;
  participantProfessionalId?: string;
  status?: Status;
}

export interface FindIdempotencyRecordParams {
  tenantId: string;
  key: string;
  operation: string;
}

export interface IdempotencyRecord<TResponse = unknown> {
  tenantId: string;
  key: string;
  operation: string;
  responseSnapshot: TResponse;
  createdAt: Date;
}

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
  abstract listExpiredHolds(now: Date, tenantId?: string): Promise<Appointment[]>;
  abstract listAppointments(filters: ListAppointmentsFilters): Promise<Appointment[]>;
  abstract findIdempotencyRecord<TResponse = unknown>(
    params: FindIdempotencyRecordParams,
  ): Promise<IdempotencyRecord<TResponse> | null>;
  abstract saveIdempotencyRecord<TResponse = unknown>(
    record: IdempotencyRecord<TResponse>,
  ): Promise<void>;
}
