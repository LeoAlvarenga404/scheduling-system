import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public items: Appointment[] = [];

  async createAppointment(appointment: Appointment): Promise<void> {
    await this.items.push(appointment);
  }

  async listAppointmentByTenantId(tenantId: string): Promise<Appointment[]> {
    return await this.items.filter(
      (appointment) => appointment.tenantId === tenantId,
    );
  }

  async getAppointmentById(
    appointmentId: string,
    tenantId: string,
  ): Promise<Appointment | null> {
    return (
      (await this.items.find(
        (appointment) =>
          appointment.id.toString() === appointmentId &&
          appointment.tenantId === tenantId,
      )) || null
    );
  }
  async cancelAppointment(appointmentId: string): Promise<void> {
    const index = await this.items.findIndex(
      (appointment) => appointment.id.toString() === appointmentId,
    );

    this.items[index].cancelAppointment();
  }
  async confirmAppointment(appointmentId: string): Promise<void> {
    const index = await this.items.findIndex(
      (appointment) => appointment.id.toString() === appointmentId,
    );

    this.items[index].confirmAppointment();
  }
  async completeAppointment(appointmentId: string): Promise<void> {
    const index = await this.items.findIndex(
      (appointment) => appointment.id.toString() === appointmentId,
    );

    this.items[index].completeAppointment();
  }
  async update(appointment: Appointment): Promise<void> {
    const index = await this.items.findIndex(
      (ap) => ap.id.toString() === appointment.id.toString(),
    );

    this.items[index] = appointment;
  }

  async rescheduleAppointment({
    appointmentId,
    newStartDate,
    newEndDate,
  }: {
    appointmentId: string;
    newStartDate: Date;
    newEndDate: Date;
  }): Promise<void> {
    const index = await this.items.findIndex(
      (appointment) => appointment.id.toString() === appointmentId,
    );

    this.items[index].startDate = newStartDate;
    this.items[index].endDate = newEndDate;
  }
}
