import type { AppointmentStatus } from "../value-objects/appointment-status.vo";
import type { HoldExpiration } from "../value-objects/hold-expiration.vo";
import type { Participants } from "../value-objects/participants.vo";
import type { ProfessionalId } from "../value-objects/professional-id.vo";
import type { RoomId } from "../value-objects/room-id.vo";
import type { TenantId } from "../value-objects/tenant-id.vo";
import type { TimeSlot } from "../value-objects/time-slot.vo";

export interface AppointmentMetadata {
  [key: string]: unknown;
}

export interface AppointmentProps {
  tenantId: TenantId | string;
  roomId: RoomId | string;
  startAt?: Date;
  endAt?: Date;
  timeslot?: TimeSlot;
  status: AppointmentStatus;
  responsibleProfessionalId: ProfessionalId | string;
  participantProfessionalIds?: Array<ProfessionalId | string>;
  participants?: Participants;
  customerId?: string;
  holdExpiresAt?: Date;
  holdExpiration?: HoldExpiration;
  externalRef?: string;
  paymentRef?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  metadata?: AppointmentMetadata;
}

export interface AppointmentState {
  tenantId: TenantId;
  roomId: RoomId;
  timeslot: TimeSlot;
  status: AppointmentStatus;
  responsibleProfessionalId: ProfessionalId;
  participants?: Participants;
  customerId?: string;
  holdExpiration?: HoldExpiration;
  externalRef?: string;
  paymentRef?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata?: AppointmentMetadata;
}

export interface RescheduleAppointmentProps {
  roomId: RoomId | string;
  startAt?: Date;
  endAt?: Date;
  timeslot?: TimeSlot;
  responsibleProfessionalId: ProfessionalId | string;
  participantProfessionalIds?: Array<ProfessionalId | string>;
  participants?: Participants;
  resetToHold: boolean;
  holdExpiresAt?: Date;
  holdExpiration?: HoldExpiration;
}
