import { Entity } from "../core/entities/entity";
import { UniqueEntityID } from "../core/entities/unique-entity-id";
import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { HoldExpiredError } from "../errors/hold-expired.error";
import { InvalidAppointmentStateError } from "../errors/invalid-appointment-state.error";
import { AppointmentCancelledEvent } from "../events/appointment-cancelled.event";
import { AppointmentCompletedEvent } from "../events/appointment-completed.event";
import { AppointmentConfirmedEvent } from "../events/appointment-confirmed.event";
import { AppointmentCreatedEvent } from "../events/appointment-created.event";
import { AppointmentExpiredEvent } from "../events/appointment-expired.event";
import { AppointmentRescheduledEvent } from "../events/appointment-rescheduled.event";
import { AppointmentId } from "../value-objects/appointment-id.vo";
import { AppointmentStatus } from "../value-objects/appointment-status.vo";
import { HoldExpiration } from "../value-objects/hold-expiration.vo";
import { Participants } from "../value-objects/participants.vo";
import { ProfessionalId } from "../value-objects/professional-id.vo";
import { RoomId } from "../value-objects/room-id.vo";
import { TenantId } from "../value-objects/tenant-id.vo";
import { TimeSlot } from "../value-objects/time-slot.vo";
import type {
  AppointmentProps,
  AppointmentState,
  RescheduleAppointmentProps,
} from "./appointment.types";

export class Appointment extends Entity<AppointmentState> {
  get appointmentId(): AppointmentId {
    return AppointmentId.fromUniqueEntityID(this.id);
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get roomId() {
    return this.props.roomId;
  }

  get timeslot() {
    return this.props.timeslot;
  }

  get startAt() {
    return this.props.timeslot.start;
  }

  get endAt() {
    return this.props.timeslot.end;
  }

  get status() {
    return this.props.status;
  }

  get responsibleProfessionalId() {
    return this.props.responsibleProfessionalId;
  }

  get participants() {
    return this.props.participants;
  }

  get participantProfessionalIds(): string[] | undefined {
    return this.props.participants?.toValues();
  }

  get involvedProfessionalIds(): string[] {
    return [
      this.props.responsibleProfessionalId.value,
      ...(this.props.participants?.toValues() ?? []),
    ];
  }

  get customerId() {
    return this.props.customerId;
  }

  get holdExpiration() {
    return this.props.holdExpiration;
  }

  get holdExpiresAt() {
    return this.props.holdExpiration?.value;
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

    if (!this.props.holdExpiration) {
      throw new AppointmentValidationError(
        "holdExpiresAt is mandatory when appointment status is HOLD.",
      );
    }

    return this.props.holdExpiration.isExpired(now);
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
    this.props.holdExpiration = undefined;

    this.addDomainEvent(
      new AppointmentConfirmedEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
        this.props.paymentRef,
      ),
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
    this.props.holdExpiration = undefined;

    this.addDomainEvent(
      new AppointmentConfirmedEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
        paymentRef,
      ),
    );
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
    this.props.holdExpiration = undefined;

    if (details?.reason || details?.cancelledBy) {
      this.props.metadata = {
        ...(this.props.metadata ?? {}),
        cancelledReason: details.reason,
        cancelledBy: details.cancelledBy,
      };
    }

    this.addDomainEvent(
      new AppointmentCancelledEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
        details?.reason,
        details?.cancelledBy,
      ),
    );
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
    this.addDomainEvent(
      new AppointmentCompletedEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
      ),
    );
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
    this.props.holdExpiration = undefined;
    this.addDomainEvent(
      new AppointmentExpiredEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
      ),
    );
    this.touch();

    return true;
  }

  reschedule({
    roomId,
    startAt,
    endAt,
    timeslot,
    responsibleProfessionalId,
    participantProfessionalIds,
    participants,
    resetToHold,
    holdExpiresAt,
    holdExpiration,
  }: RescheduleAppointmentProps) {
    const normalizedRoomId = Appointment.normalizeRoomId(roomId);
    const normalizedTimeSlot = Appointment.normalizeTimeSlot({
      startAt,
      endAt,
      timeslot,
    });
    const normalizedResponsibleProfessionalId =
      Appointment.normalizeProfessionalId(responsibleProfessionalId);
    const normalizedParticipants = Appointment.normalizeParticipants({
      participants,
      participantProfessionalIds,
      responsibleProfessionalId: normalizedResponsibleProfessionalId,
    });
    const normalizedHoldExpiration = resetToHold
      ? Appointment.normalizeHoldExpiration({
          holdExpiresAt,
          holdExpiration,
        })
      : undefined;

    Appointment.assertValidSchedule({
      tenantId: this.tenantId,
      roomId: normalizedRoomId,
      timeslot: normalizedTimeSlot,
      status: resetToHold ? AppointmentStatus.create("HOLD") : this.status,
      responsibleProfessionalId: normalizedResponsibleProfessionalId,
      participants: normalizedParticipants,
      holdExpiration: normalizedHoldExpiration,
    });

    const previousRoomId = this.props.roomId.value;
    const previousStartAt = this.props.timeslot.start;
    const previousEndAt = this.props.timeslot.end;

    this.props.roomId = normalizedRoomId;
    this.props.timeslot = normalizedTimeSlot;
    this.props.responsibleProfessionalId = normalizedResponsibleProfessionalId;
    this.props.participants = normalizedParticipants;

    if (resetToHold) {
      this.props.status = this.status.changeTo("HOLD");
      this.props.holdExpiration = normalizedHoldExpiration;
      this.props.paymentRef = undefined;
      this.props.paidAt = undefined;
    }

    this.addDomainEvent(
      new AppointmentRescheduledEvent(
        this.appointmentId.value,
        this.props.tenantId.value,
        previousRoomId,
        this.props.roomId.value,
        previousStartAt,
        previousEndAt,
        this.props.timeslot.start,
        this.props.timeslot.end,
      ),
    );
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
    this.props.version = (this.props.version ?? 0) + 1;
  }

  static normalizeParticipantProfessionalIds(
    participantProfessionalIds: Array<ProfessionalId | string> | undefined,
    responsibleProfessionalId: ProfessionalId | string,
  ): string[] | undefined {
    if (!participantProfessionalIds?.length) {
      return undefined;
    }

    const responsibleProfessionalIdValue = Appointment.normalizeProfessionalId(
      responsibleProfessionalId,
    ).value;
    const uniqueParticipants = Array.from(
      new Set(
        participantProfessionalIds
          .map(
            (participantProfessionalId) =>
              Appointment.normalizeProfessionalId(participantProfessionalId)
                .value,
          )
          .filter(Boolean),
      ),
    ).filter(
      (professionalId) => professionalId !== responsibleProfessionalIdValue,
    );

    return uniqueParticipants.length > 0 ? uniqueParticipants : undefined;
  }

  static create(
    props: AppointmentProps,
    id?: UniqueEntityID | AppointmentId,
  ): Appointment {
    const tenantId = Appointment.normalizeTenantId(props.tenantId);
    const roomId = Appointment.normalizeRoomId(props.roomId);
    const timeslot = Appointment.normalizeTimeSlot({
      startAt: props.startAt,
      endAt: props.endAt,
      timeslot: props.timeslot,
    });
    const responsibleProfessionalId = Appointment.normalizeProfessionalId(
      props.responsibleProfessionalId,
    );
    const participants = Appointment.normalizeParticipants({
      participants: props.participants,
      participantProfessionalIds: props.participantProfessionalIds,
      responsibleProfessionalId,
    });
    const holdExpiration = Appointment.normalizeHoldExpiration({
      holdExpiresAt: props.holdExpiresAt,
      holdExpiration: props.holdExpiration,
    });

    Appointment.assertValidSchedule({
      tenantId,
      roomId,
      timeslot,
      status: props.status,
      responsibleProfessionalId,
      participants,
      holdExpiration,
    });

    const now = new Date();

    const appointment = new Appointment(
      {
        tenantId,
        roomId,
        timeslot,
        status: props.status,
        responsibleProfessionalId,
        participants,
        customerId: props.customerId,
        holdExpiration,
        externalRef: props.externalRef,
        paymentRef: props.paymentRef,
        paidAt: props.paidAt,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? props.createdAt ?? now,
        version: props.version ?? 0,
        metadata: props.metadata,
      },
      Appointment.normalizeUniqueEntityID(id),
    );

    appointment.addDomainEvent(
      new AppointmentCreatedEvent(
        appointment.appointmentId.value,
        appointment.tenantId.value,
        appointment.roomId.value,
        appointment.startAt,
        appointment.endAt,
      ),
    );

    return appointment;
  }

  private static normalizeUniqueEntityID(
    id?: UniqueEntityID | AppointmentId,
  ): UniqueEntityID | undefined {
    if (!id) {
      return undefined;
    }

    if (id instanceof UniqueEntityID) {
      return id;
    }

    return id.toUniqueEntityID();
  }

  private static normalizeTenantId(tenantId: TenantId | string): TenantId {
    return tenantId instanceof TenantId ? tenantId : TenantId.create(tenantId);
  }

  private static normalizeRoomId(roomId: RoomId | string): RoomId {
    return roomId instanceof RoomId ? roomId : RoomId.create(roomId);
  }

  private static normalizeProfessionalId(
    professionalId: ProfessionalId | string,
  ): ProfessionalId {
    return professionalId instanceof ProfessionalId
      ? professionalId
      : ProfessionalId.create(professionalId);
  }

  private static normalizeHoldExpiration({
    holdExpiresAt,
    holdExpiration,
  }: {
    holdExpiresAt?: Date;
    holdExpiration?: HoldExpiration;
  }): HoldExpiration | undefined {
    if (holdExpiration) {
      return holdExpiration;
    }

    if (!holdExpiresAt) {
      return undefined;
    }

    return HoldExpiration.create(holdExpiresAt);
  }

  private static normalizeTimeSlot({
    startAt,
    endAt,
    timeslot,
  }: {
    startAt?: Date;
    endAt?: Date;
    timeslot?: TimeSlot;
  }): TimeSlot {
    if (timeslot) {
      return timeslot;
    }

    if (!startAt || !endAt) {
      throw new AppointmentValidationError("startAt and endAt are mandatory.");
    }

    return TimeSlot.create(startAt, endAt);
  }

  private static normalizeParticipants({
    participants,
    participantProfessionalIds,
    responsibleProfessionalId,
  }: {
    participants?: Participants;
    participantProfessionalIds?: Array<ProfessionalId | string>;
    responsibleProfessionalId: ProfessionalId;
  }): Participants | undefined {
    const normalizedParticipantProfessionalIds =
      Appointment.normalizeParticipantProfessionalIds(
        participants?.professionals ?? participantProfessionalIds,
        responsibleProfessionalId,
      );

    if (!normalizedParticipantProfessionalIds) {
      return undefined;
    }

    return Participants.create(
      normalizedParticipantProfessionalIds.map((participantProfessionalId) =>
        ProfessionalId.create(participantProfessionalId),
      ),
    );
  }

  private static assertValidSchedule({
    tenantId,
    roomId,
    responsibleProfessionalId,
    participants,
    timeslot,
    status,
    holdExpiration,
  }: {
    tenantId: TenantId;
    roomId: RoomId;
    responsibleProfessionalId: ProfessionalId;
    participants?: Participants;
    timeslot: TimeSlot;
    status: AppointmentStatus;
    holdExpiration?: HoldExpiration;
  }) {
    if (!tenantId.value) {
      throw new AppointmentValidationError("tenantId is mandatory.");
    }

    if (!roomId.value) {
      throw new AppointmentValidationError("roomId is mandatory.");
    }

    if (!responsibleProfessionalId.value) {
      throw new AppointmentValidationError(
        "responsibleProfessionalId is mandatory.",
      );
    }

    if (timeslot.end.getTime() <= timeslot.start.getTime()) {
      throw new AppointmentValidationError(
        "endAt must be greater than startAt.",
      );
    }

    if (participants?.contains(responsibleProfessionalId)) {
      throw new AppointmentValidationError(
        "participantProfessionalIds cannot contain responsibleProfessionalId.",
      );
    }

    if (status.value === "HOLD" && !holdExpiration) {
      throw new AppointmentValidationError(
        "holdExpiresAt is mandatory when status is HOLD.",
      );
    }
  }
}
