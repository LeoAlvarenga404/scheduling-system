import { Appointment } from "../entities/appointment";

export abstract class AppointmentRepository {
  abstract createAppointment(appointment: Appointment): Promise<void>;
  abstract listAppointmentByTenantId(tenantId: string): Promise<Appointment[]>;
  abstract getAppointmentById(
    appointmentId: string,
  ): Promise<Appointment | null>;
  abstract cancelAppointment(appointmentId: string): Promise<void>;
}
