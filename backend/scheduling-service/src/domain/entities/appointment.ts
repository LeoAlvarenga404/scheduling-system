import { Entity } from "../core/entities/entity";
import { UniqueEntityID } from "../core/entities/unique-entity-id";
import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { HoldExpiredError } from "../errors/hold-expired.error";
import { InvalidAppointmentStateError } from "../errors/invalid-appointment-state.error";
import { AppointmentStatus } from "../value-objects/appointment-status.vo";

export interface AppointmentMetadata {
  [key: string]: unknown;
}

export interface AppointmentProps {
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

export class Appointment extends Entity<AppointmentProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get roomId() {
    return this.props.roomId;
  }

  get startAt() {
    return this.props.startAt;
  }

  get endAt() {
    return this.props.endAt;
  }

  get status() {
    return this.props.status;
  }

  get responsibleProfessionalId() {
    return this.props.responsibleProfessionalId;
  }

  get participantProfessionalIds() {
    return this.props.participantProfessionalIds;
  }

  get involvedProfessionalIds(): string[] {
    return [
      this.props.responsibleProfessionalId,
      ...(this.props.participantProfessionalIds ?? []),
    ];
  }

  get customerId() {
    return this.props.customerId;
  }

  get holdExpiresAt() {
    return this.props.holdExpiresAt;
  }

  get externalRef() {
    return this.props.externalRef;
  }

  get paymentRef() {
    return this.props.paymentRef;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get version() {
    return this.props.version;
  }

  get metadata() {
    return this.props.metadata;
  }

  isHoldExpired(now = new Date()): boolean {
    if (this.status.value !== "HOLD") {
      return false;
    }

    if (!this.props.holdExpiresAt) {
      throw new AppointmentValidationError(
        "holdExpiresAt is mandatory when appointment status is HOLD.",
      );
    }

    return this.props.holdExpiresAt.getTime() <= now.getTime();
  }

  confirm(now = new Date()) {
    if (this.status.value === "CONFIRMED") {
      return;
    }

    if (this.status.value !== "HOLD") {
      throw new InvalidAppointmentStateError(
        "Only appointments in HOLD can be confirmed.",
      );
    }

    if (this.isHoldExpired(now)) {
      throw new HoldExpiredError();
    }

    this.props.status = this.status.changeTo("CONFIRMED");
    this.props.holdExpiresAt = undefined;
    this.touch();
  }

  confirmWhenPaid({
    paymentRef,
    paidAt,
    now = new Date(),
  }: {
    paymentRef: string;
    paidAt: Date;
    now?: Date;
  }) {
    if (!paymentRef) {
      throw new AppointmentValidationError("paymentRef is mandatory.");
    }

    if (!(paidAt instanceof Date) || Number.isNaN(paidAt.getTime())) {
      throw new AppointmentValidationError("paidAt must be a valid Date.");
    }

    if (this.status.value !== "HOLD") {
      throw new InvalidAppointmentStateError(
        "Only appointments in HOLD can be confirmed by payment.",
      );
    }

    if (this.isHoldExpired(now)) {
      throw new HoldExpiredError();
    }

    this.props.paymentRef = paymentRef;
    this.props.paidAt = paidAt;
    this.props.status = this.status.changeTo("CONFIRMED");
    this.props.holdExpiresAt = undefined;
    this.touch();
  }

  cancel(details?: { reason?: string; cancelledBy?: string }) {
    if (this.status.value === "CANCELLED" || this.status.value === "EXPIRED") {
      return;
    }

    if (this.status.value !== "HOLD" && this.status.value !== "CONFIRMED") {
      throw new InvalidAppointmentStateError(
        "Only HOLD or CONFIRMED appointments can be cancelled.",
      );
    }

    this.props.status = this.status.changeTo("CANCELLED");
    this.props.holdExpiresAt = undefined;

    if (details?.reason || details?.cancelledBy) {
      this.props.metadata = {
        ...(this.props.metadata ?? {}),
        cancelledReason: details.reason,
        cancelledBy: details.cancelledBy,
      };
    }

    this.touch();
  }

  complete() {
    if (this.status.value === "COMPLETED") {
      return;
    }

    if (this.status.value !== "CONFIRMED") {
      throw new InvalidAppointmentStateError(
        "Only CONFIRMED appointments can be completed.",
      );
    }

    this.props.status = this.status.changeTo("COMPLETED");
    this.touch();
  }

  expireHold(now = new Date()): boolean {
    if (this.status.value !== "HOLD") {
      return false;
    }

    if (!this.isHoldExpired(now)) {
      return false;
    }

    this.props.status = this.status.changeTo("EXPIRED");
    this.props.holdExpiresAt = undefined;
    this.touch();

    return true;
  }

  reschedule({
    roomId,
    startAt,
    endAt,
    responsibleProfessionalId,
    participantProfessionalIds,
    resetToHold,
    holdExpiresAt,
  }: RescheduleAppointmentProps) {
    Appointment.assertValidSchedule({
      tenantId: this.tenantId,
      roomId,
      startAt,
      endAt,
      status: resetToHold ? AppointmentStatus.create("HOLD") : this.status,
      responsibleProfessionalId,
      participantProfessionalIds,
      holdExpiresAt,
    });

    this.props.roomId = roomId;
    this.props.startAt = startAt;
    this.props.endAt = endAt;
    this.props.responsibleProfessionalId = responsibleProfessionalId;
    this.props.participantProfessionalIds = participantProfessionalIds;

    if (resetToHold) {
      this.props.status = this.status.changeTo("HOLD");
      this.props.holdExpiresAt = holdExpiresAt;
      this.props.paymentRef = undefined;
      this.props.paidAt = undefined;
    }

    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
    this.props.version = (this.props.version ?? 0) + 1;
  }

  static normalizeParticipantProfessionalIds(
    participantProfessionalIds: string[] | undefined,
    responsibleProfessionalId: string,
  ): string[] | undefined {
    if (!participantProfessionalIds?.length) {
      return undefined;
    }

    const uniqueParticipants = Array.from(
      new Set(participantProfessionalIds.filter(Boolean)),
    ).filter((professionalId) => professionalId !== responsibleProfessionalId);

    return uniqueParticipants.length > 0 ? uniqueParticipants : undefined;
  }

  static create(props: AppointmentProps, id?: UniqueEntityID) {
    const normalizedParticipants = Appointment.normalizeParticipantProfessionalIds(
      props.participantProfessionalIds,
      props.responsibleProfessionalId,
    );

    Appointment.assertValidSchedule({
      ...props,
      participantProfessionalIds: normalizedParticipants,
    });

    const now = new Date();

    const appointment = new Appointment(
      {
        ...props,
        participantProfessionalIds: normalizedParticipants,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? props.createdAt ?? now,
        version: props.version ?? 0,
      },
      id,
    );

    return appointment;
  }

  private static assertValidSchedule({
    tenantId,
    roomId,
    responsibleProfessionalId,
    participantProfessionalIds,
    startAt,
    endAt,
    status,
    holdExpiresAt,
  }: {
    tenantId: string;
    roomId: string;
    responsibleProfessionalId: string;
    participantProfessionalIds?: string[];
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    holdExpiresAt?: Date;
  }) {
    if (!tenantId) {
      throw new AppointmentValidationError("tenantId is mandatory.");
    }

    if (!roomId) {
      throw new AppointmentValidationError("roomId is mandatory.");
    }

    if (!responsibleProfessionalId) {
      throw new AppointmentValidationError(
        "responsibleProfessionalId is mandatory.",
      );
    }

    if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
      throw new AppointmentValidationError("startAt must be a valid Date.");
    }

    if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
      throw new AppointmentValidationError("endAt must be a valid Date.");
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new AppointmentValidationError("endAt must be greater than startAt.");
    }

    if (participantProfessionalIds?.includes(responsibleProfessionalId)) {
      throw new AppointmentValidationError(
        "participantProfessionalIds cannot contain responsibleProfessionalId.",
      );
    }

    if (participantProfessionalIds) {
      const uniqueCount = new Set(participantProfessionalIds).size;
      if (uniqueCount !== participantProfessionalIds.length) {
        throw new AppointmentValidationError(
          "participantProfessionalIds cannot contain duplicates.",
        );
      }
    }

    if (status.value === "HOLD") {
      if (!holdExpiresAt) {
        throw new AppointmentValidationError(
          "holdExpiresAt is mandatory when status is HOLD.",
        );
      }

      if (
        !(holdExpiresAt instanceof Date) ||
        Number.isNaN(holdExpiresAt.getTime())
      ) {
        throw new AppointmentValidationError(
          "holdExpiresAt must be a valid Date.",
        );
      }
    }
  }
}
