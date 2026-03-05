import type { Appointment } from "../entities/appointment";
import type { Status } from "../value-objects/appointment-status.vo";

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
