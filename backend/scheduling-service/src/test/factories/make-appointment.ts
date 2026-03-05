import { Appointment } from "src/domain/entities/appointment";
import type { AppointmentProps } from "src/domain/entities/appointment.types";
import { AppointmentStatus, Status } from "src/domain/value-objects/appointment-status.vo";

interface MakeAppointmentProps extends Partial<Omit<AppointmentProps, "status">> {
  status?: Status;
}

export function makeAppointment(props: MakeAppointmentProps = {}): Appointment {
  const status = props.status ?? "HOLD";

  return Appointment.create({
    tenantId: props.tenantId ?? "tenant-01",
    roomId: props.roomId ?? "room-101",
    startAt: props.startAt ?? new Date("2026-03-10T13:00:00.000Z"),
    endAt: props.endAt ?? new Date("2026-03-10T13:45:00.000Z"),
    status: AppointmentStatus.create(status),
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
}
