import { Entity } from "../core/entities/entity";
import { UniqueEntityID } from "../core/entities/unique-entity-id";
import { AppointmentStatus } from "../value-objects/appointment-status.vo";

export interface AppointmentProps {
  tenantId: string;
  customerId: string;
  professionalId: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Appointment extends Entity<AppointmentProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get customerId() {
    return this.props.customerId;
  }

  get professionalId() {
    return this.props.professionalId;
  }

  get scheduledAt() {
    return this.props.scheduledAt;
  }

  get status() {
    return this.props.status;
  }

  cancelAppointment() {
    this.status.changeTo("CANCELLED");
    this.touch();
  }

  confirmAppointment() {
    this.status.changeTo("CONFIRMED");
    this.touch();
  }

  completeAppointment() {
    this.status.changeTo("COMPLETED");
    this.touch();
  }

  reschedule(date: Date) {
    this.props.scheduledAt = date;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(_props: AppointmentProps, id?: UniqueEntityID) {
    const appointment = new Appointment(
      { ..._props, createdAt: _props.createdAt ?? new Date() },
      id,
    );

    return appointment;
  }
}
