import { randomUUID } from "node:crypto";
import type {
  AppointmentMetadata,
  AppointmentProps,
  AppointmentStatus,
  RescheduleAppointmentProps,
} from "./appointment.types";
import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { HoldExpiredError } from "../errors/hold-expired.error";
import { InvalidAppointmentStateError } from "../errors/invalid-appointment-state.error";
import { AppointmentCancelledEvent } from "../events/appointment-cancelled.event";
import { AppointmentCompletedEvent } from "../events/appointment-completed.event";
import { AppointmentConfirmedEvent } from "../events/appointment-confirmed.event";
import { AppointmentCreatedEvent } from "../events/appointment-created.event";
import { AppointmentExpiredEvent } from "../events/appointment-expired.event";
import { AppointmentRescheduledEvent } from "../events/appointment-rescheduled.event";
import type { DomainEvent } from "../events/domain-event";

const VALID_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "HOLD",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
]);

export class Appointment {
  private domainEvents: DomainEvent[] = [];

  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public roomId: string,
    public serviceId: string,
    public amount: number,
    public currency: string,
    public startAt: Date,
    public endAt: Date,
    public status: AppointmentStatus,
    public responsibleProfessionalId: string,
    public participantProfessionalIds: string[] | undefined,
    public customerId: string | undefined,
    public holdExpiresAt: Date | undefined,
    public externalRef: string | undefined,
    public paymentRef: string | undefined,
    public paidAt: Date | undefined,
    public confirmedAt: Date | undefined,
    public cancelledAt: Date | undefined,
    public cancelledBy: string | undefined,
    public cancelReason: string | undefined,
    public completedAt: Date | undefined,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public version: number,
    public metadata: AppointmentMetadata | undefined,
  ) {}

  get involvedProfessionalIds(): string[] {
    return [
      this.responsibleProfessionalId,
      ...(this.participantProfessionalIds ?? []),
    ];
  }

  isHoldExpired(now = new Date()): boolean {
    if (this.status !== "HOLD") {
      return false;
    }

    if (!this.holdExpiresAt) {
      throw new AppointmentValidationError(
        "holdExpiresAt is mandatory when appointment status is HOLD.",
      );
    }

    return this.holdExpiresAt.getTime() <= now.getTime();
  }

  confirm(now = new Date()): void {
    if (this.status === "CONFIRMED") {
      return;
    }

    if (this.status !== "HOLD") {
      throw new InvalidAppointmentStateError(
        "Only appointments in HOLD can be confirmed.",
      );
    }

    if (this.isHoldExpired(now)) {
      throw new HoldExpiredError();
    }

    this.status = "CONFIRMED";
    this.confirmedAt = new Date(now.getTime());
    this.holdExpiresAt = undefined;

    this.recordEvent(
      new AppointmentConfirmedEvent(this.id, this.tenantId, this.paymentRef),
    );
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
  }): void {
    const normalizedPaymentRef = Appointment.normalizeOptionalString(paymentRef);

    if (!normalizedPaymentRef) {
      throw new AppointmentValidationError("paymentRef is mandatory.");
    }

    if (!Appointment.isValidDate(paidAt)) {
      throw new AppointmentValidationError("paidAt must be a valid Date.");
    }

    if (this.status !== "HOLD") {
      throw new InvalidAppointmentStateError(
        "Only appointments in HOLD can be confirmed by payment.",
      );
    }

    if (this.isHoldExpired(now)) {
      throw new HoldExpiredError();
    }

    this.paymentRef = normalizedPaymentRef;
    this.paidAt = new Date(paidAt.getTime());
    this.status = "CONFIRMED";
    this.confirmedAt = new Date(now.getTime());
    this.holdExpiresAt = undefined;

    this.recordEvent(
      new AppointmentConfirmedEvent(this.id, this.tenantId, normalizedPaymentRef),
    );
    this.touch();
  }

  cancel(details?: { reason?: string; cancelledBy?: string }): void {
    if (this.status === "CANCELLED" || this.status === "EXPIRED") {
      return;
    }

    if (this.status !== "HOLD" && this.status !== "CONFIRMED") {
      throw new InvalidAppointmentStateError(
        "Only HOLD or CONFIRMED appointments can be cancelled.",
      );
    }

    this.status = "CANCELLED";
    this.cancelledAt = new Date();
    this.holdExpiresAt = undefined;

    if (details?.reason) {
      this.cancelReason = details.reason;
    }
    if (details?.cancelledBy) {
      this.cancelledBy = details.cancelledBy;
    }

    this.recordEvent(
      new AppointmentCancelledEvent(
        this.id,
        this.tenantId,
        details?.reason,
        details?.cancelledBy,
      ),
    );
    this.touch();
  }

  complete(): void {
    if (this.status === "COMPLETED") {
      return;
    }

    if (this.status !== "CONFIRMED") {
      throw new InvalidAppointmentStateError(
        "Only CONFIRMED appointments can be completed.",
      );
    }

    this.status = "COMPLETED";
    this.completedAt = new Date();
    
    this.recordEvent(new AppointmentCompletedEvent(this.id, this.tenantId));
    this.touch();
  }

  expireHold(now = new Date()): boolean {
    if (this.status !== "HOLD") {
      return false;
    }

    if (!this.isHoldExpired(now)) {
      return false;
    }

    this.status = "EXPIRED";
    this.holdExpiresAt = undefined;
    this.recordEvent(new AppointmentExpiredEvent(this.id, this.tenantId));
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
  }: RescheduleAppointmentProps): void {
    const nextRoomId = Appointment.requireNonEmptyString(roomId, "roomId is mandatory.");
    const nextResponsibleProfessionalId = Appointment.requireNonEmptyString(
      responsibleProfessionalId,
      "responsibleProfessionalId is mandatory.",
    );
    Appointment.assertValidInterval(startAt, endAt);

    const nextParticipants = Appointment.normalizeParticipantProfessionalIds(
      participantProfessionalIds,
      nextResponsibleProfessionalId,
    );

    if (resetToHold) {
      if (!holdExpiresAt || !Appointment.isValidDate(holdExpiresAt)) {
        throw new AppointmentValidationError(
          "holdExpiresAt is mandatory when resetting appointment to HOLD.",
        );
      }

      this.status = "HOLD";
      this.holdExpiresAt = new Date(holdExpiresAt.getTime());
      this.paymentRef = undefined;
      this.paidAt = undefined;
    }

    const previousRoomId = this.roomId;
    const previousStartAt = new Date(this.startAt.getTime());
    const previousEndAt = new Date(this.endAt.getTime());

    this.roomId = nextRoomId;
    this.startAt = new Date(startAt.getTime());
    this.endAt = new Date(endAt.getTime());
    this.responsibleProfessionalId = nextResponsibleProfessionalId;
    this.participantProfessionalIds = nextParticipants;

    this.recordEvent(
      new AppointmentRescheduledEvent(
        this.id,
        this.tenantId,
        previousRoomId,
        this.roomId,
        previousStartAt,
        previousEndAt,
        this.startAt,
        this.endAt,
      ),
    );

    this.touch();
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];

    return events;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  clearEvents(): void {
    this.clearDomainEvents();
  }

  static normalizeParticipantProfessionalIds(
    participantProfessionalIds: string[] | undefined,
    responsibleProfessionalId: string,
  ): string[] | undefined {
    const normalizedResponsibleId = Appointment.requireNonEmptyString(
      responsibleProfessionalId,
      "responsibleProfessionalId is mandatory.",
    );

    if (!participantProfessionalIds?.length) {
      return undefined;
    }

    const uniqueParticipants = Array.from(
      new Set(
        participantProfessionalIds
          .map((participantProfessionalId) =>
            Appointment.normalizeOptionalString(participantProfessionalId),
          )
          .filter((participantProfessionalId): participantProfessionalId is string =>
            Boolean(participantProfessionalId),
          ),
      ),
    ).filter(
      (participantProfessionalId) =>
        participantProfessionalId !== normalizedResponsibleId,
    );

    return uniqueParticipants.length > 0 ? uniqueParticipants : undefined;
  }

  static create(props: AppointmentProps): Appointment {
    return Appointment.build(props, true);
  }

  static rehydrate(
    props: AppointmentProps & {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      version: number;
    },
  ): Appointment {
    return Appointment.build(props, false);
  }

  private static build(
    props: AppointmentProps,
    emitCreatedEvent: boolean,
  ): Appointment {
    const tenantId = Appointment.requireNonEmptyString(
      props.tenantId,
      "tenantId is mandatory.",
    );
    const roomId = Appointment.requireNonEmptyString(
      props.roomId,
      "roomId is mandatory.",
    );
    const serviceId = Appointment.requireNonEmptyString(
      props.serviceId,
      "serviceId is mandatory.",
    );
    const amount = props.amount;
    if (typeof amount !== 'number' || amount < 0) {
      throw new AppointmentValidationError("amount must be a positive number.");
    }
    const currency = Appointment.normalizeOptionalString(props.currency) ?? "BRL";
    
    const responsibleProfessionalId = Appointment.requireNonEmptyString(
      props.responsibleProfessionalId,
      "responsibleProfessionalId is mandatory.",
    );

    Appointment.assertValidInterval(props.startAt, props.endAt);
    Appointment.assertValidStatus(props.status);

    const participantProfessionalIds =
      Appointment.normalizeParticipantProfessionalIds(
        props.participantProfessionalIds,
        responsibleProfessionalId,
      );

    const holdExpiresAt = props.holdExpiresAt
      ? Appointment.cloneDate(props.holdExpiresAt, "holdExpiresAt must be a valid Date.")
      : undefined;

    if (props.status === "HOLD" && !holdExpiresAt) {
      throw new AppointmentValidationError(
        "holdExpiresAt is mandatory when status is HOLD.",
      );
    }

    const now = new Date();
    const createdAt = props.createdAt
      ? Appointment.cloneDate(props.createdAt, "createdAt must be a valid Date.")
      : now;
    const updatedAt = props.updatedAt
      ? Appointment.cloneDate(props.updatedAt, "updatedAt must be a valid Date.")
      : createdAt;
      
    const confirmedAt = props.confirmedAt ? Appointment.cloneDate(props.confirmedAt, "confirmedAt must be a valid Date.") : undefined;
    const cancelledAt = props.cancelledAt ? Appointment.cloneDate(props.cancelledAt, "cancelledAt must be a valid Date.") : undefined;
    const completedAt = props.completedAt ? Appointment.cloneDate(props.completedAt, "completedAt must be a valid Date.") : undefined;

    const appointment = new Appointment(
      Appointment.normalizeOptionalString(props.id) ?? randomUUID(),
      tenantId,
      roomId,
      serviceId,
      amount,
      currency,
      new Date(props.startAt.getTime()),
      new Date(props.endAt.getTime()),
      props.status,
      responsibleProfessionalId,
      participantProfessionalIds,
      Appointment.normalizeOptionalString(props.customerId),
      holdExpiresAt,
      Appointment.normalizeOptionalString(props.externalRef),
      Appointment.normalizeOptionalString(props.paymentRef),
      props.paidAt
        ? Appointment.cloneDate(props.paidAt, "paidAt must be a valid Date.")
        : undefined,
      confirmedAt,
      cancelledAt,
      Appointment.normalizeOptionalString(props.cancelledBy),
      Appointment.normalizeOptionalString(props.cancelReason),
      completedAt,
      createdAt,
      updatedAt,
      props.version ?? 0,
      props.metadata,
    );

    if (emitCreatedEvent) {
      appointment.recordEvent(
        new AppointmentCreatedEvent(
          appointment.id,
          appointment.tenantId,
          appointment.roomId,
          appointment.startAt,
          appointment.endAt,
        ),
      );
    }

    return appointment;
  }

  private static assertValidStatus(status: AppointmentStatus): void {
    if (!VALID_STATUSES.has(status)) {
      throw new AppointmentValidationError("status is invalid.");
    }
  }

  private static assertValidInterval(startAt: Date, endAt: Date): void {
    if (!Appointment.isValidDate(startAt)) {
      throw new AppointmentValidationError("startAt must be a valid Date.");
    }

    if (!Appointment.isValidDate(endAt)) {
      throw new AppointmentValidationError("endAt must be a valid Date.");
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new AppointmentValidationError("endAt must be greater than startAt.");
    }
  }

  private static requireNonEmptyString(value: string | undefined, message: string): string {
    const normalizedValue = Appointment.normalizeOptionalString(value);

    if (!normalizedValue) {
      throw new AppointmentValidationError(message);
    }

    return normalizedValue;
  }

  private static normalizeOptionalString(value?: string | null): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  private static isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  private static cloneDate(value: Date, errorMessage: string): Date {
    if (!Appointment.isValidDate(value)) {
      throw new AppointmentValidationError(errorMessage);
    }

    return new Date(value.getTime());
  }

  private recordEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version += 1;
  }
}
