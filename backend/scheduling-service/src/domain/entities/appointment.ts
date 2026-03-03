import { Entity } from "../core/entities/entity";
import { UniqueEntityID } from "../core/entities/unique-entity-id";
import { AppointmentStatus } from "../value-objects/appointment-status.vo";

export interface AppointmentProps {
  tenantId: string;
  customerId: string;
  professionalId: string;
  startDate: Date;
  endDate: Date;
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

  get startDate() {
    return this.props.startDate;
  }

  get endDate() {
    return this.props.endDate;
  }

  set startDate(date: Date) {
    this.props.startDate = date;
    this.touch();
  }

  set endDate(date: Date) {
    this.props.endDate = date;
    this.touch();
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

  reschedule({ startDate, endDate }: { startDate: Date; endDate: Date }) {
    if (!startDate || !endDate) {
      throw new Error("startDate or endDate is mandatory");
    }

    this.props.startDate = startDate;
    this.props.endDate = endDate;
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
