import { Entity } from "../core/entities/entity";
import { UniqueEntityID } from "../core/entities/unique-entity-id";

export interface AppointmentProps {
  tenantId: string;
  customerId: string;
  professionalId: string;
  scheduledAt: Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: Date;
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
    this.changeStatus("CANCELLED");
    this.touch();
  }

  private changeStatus(
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
  ) {
    this.props.status = status;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(_props: AppointmentProps, id?: UniqueEntityID) {
    const appointment = new Appointment({ ..._props }, id);

    return appointment;
  }
}
