import type { Appointment } from "../entities/appointment";
import type { AppointmentStatus } from "../entities/appointment.types";

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
  status?: AppointmentStatus;
}
