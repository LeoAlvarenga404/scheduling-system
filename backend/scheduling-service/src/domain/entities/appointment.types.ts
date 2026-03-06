export type AppointmentStatus =
  | "HOLD"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export interface AppointmentMetadata {
  [key: string]: unknown;
}

export interface AppointmentProps {
  id?: string;
  tenantId: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  responsibleProfessionalId: string;
  participantProfessionalIds?: string[];
  customerId?: string;
  holdExpiresAt?: Date;
  externalRef?: string;
  paymentRef?: string;
  paidAt?: Date;
  creationIdempotencyKey?: string;
  paymentConfirmationKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  metadata?: AppointmentMetadata;
}

export interface RescheduleAppointmentProps {
  roomId: string;
  startAt: Date;
  endAt: Date;
  responsibleProfessionalId: string;
  participantProfessionalIds?: string[];
  resetToHold: boolean;
  holdExpiresAt?: Date;
}
