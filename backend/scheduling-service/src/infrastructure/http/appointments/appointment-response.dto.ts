import type {
  AppointmentMetadata,
  AppointmentStatus,
} from "src/domain/entities/appointment.types";

export interface AppointmentResponseDto {
  id: string;
  tenantId: string;
  roomId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  responsibleProfessionalId: string;
  participantProfessionalIds: string[];
  customerId: string | null;
  holdExpiresAt: string | null;
  externalRef: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata: AppointmentMetadata | null;
}
