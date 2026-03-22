import { Appointment } from "src/domain/entities/appointment";
import type {
  AppointmentProps,
  AppointmentStatus,
} from "src/domain/entities/appointment.types";

interface MakeAppointmentProps
  extends Partial<Omit<AppointmentProps, "status" | "startAt" | "endAt">> {
  status?: AppointmentStatus;
  startAt?: Date;
  endAt?: Date;
}

export function makeAppointment(props: MakeAppointmentProps = {}): Appointment {
  const status = props.status ?? "HOLD";
  const appointment = Appointment.create({
    tenantId: props.tenantId ?? "tenant-01",
    roomId: props.roomId ?? "room-101",
    serviceId: props.serviceId ?? "srv-101",
    amount: props.amount ?? 15000,
    currency: props.currency ?? "BRL",
    startAt: props.startAt ?? new Date("2026-03-10T13:00:00.000Z"),
    endAt: props.endAt ?? new Date("2026-03-10T13:45:00.000Z"),
    status,
    responsibleProfessionalId: props.responsibleProfessionalId ?? "prof-10",
    participantProfessionalIds: props.participantProfessionalIds,
    customerId: props.customerId,
    holdExpiresAt:
      props.holdExpiresAt ??
      (status === "HOLD" ? new Date("2026-03-10T13:10:00.000Z") : undefined),
    externalRef: props.externalRef,
    paymentRef: props.paymentRef,
    paidAt: props.paidAt,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
    version: props.version,
    metadata: props.metadata,
  });

  appointment.clearDomainEvents();

  return appointment;
}

