import type { Appointment } from "src/domain/entities/appointment";
import type { AppointmentResponseDto } from "./appointment-response.dto";

export class AppointmentHttpMapper {
  static toResponse(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      roomId: appointment.roomId,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      responsibleProfessionalId: appointment.responsibleProfessionalId,
      participantProfessionalIds: appointment.participantProfessionalIds ?? [],
      customerId: appointment.customerId ?? null,
      holdExpiresAt: appointment.holdExpiresAt?.toISOString() ?? null,
      externalRef: appointment.externalRef ?? null,
      paymentRef: appointment.paymentRef ?? null,
      paidAt: appointment.paidAt?.toISOString() ?? null,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      version: appointment.version,
      metadata: appointment.metadata ?? null,
    };
  }
}
