import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AlreadyConfirmedWithOtherPaymentError } from "src/domain/errors/already-confirmed-with-other-payment.error";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { IdempotencyKeyRequiredError } from "src/domain/errors/idempotency-key-required.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

export interface ConfirmAppointmentWhenPaidRequest {
  tenantId: string;
  appointmentId?: string;
  externalRef?: string;
  paymentRef: string;
  paidAt: Date;
  idempotencyKey: string;
  now?: Date;
}

export type ConfirmAppointmentWhenPaidOutput = Either<
  | AppointmentNotFoundError
  | AppointmentValidationError
  | HoldExpiredError
  | IdempotencyKeyRequiredError
  | InvalidAppointmentStateError
  | AlreadyConfirmedWithOtherPaymentError,
  {
    appointment: Appointment;
  }
>;

export class ConfirmAppointmentWhenPaidUseCase
  implements
    UseCase<ConfirmAppointmentWhenPaidRequest, ConfirmAppointmentWhenPaidOutput>
{
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    tenantId,
    appointmentId,
    externalRef,
    paymentRef,
    paidAt,
    idempotencyKey,
    now,
  }: ConfirmAppointmentWhenPaidRequest): Promise<ConfirmAppointmentWhenPaidOutput> {
    if (!idempotencyKey) {
      return left(new IdempotencyKeyRequiredError());
    }

    const existingByIdempotencyKey =
      await this.appointmentRepository.findByPaymentConfirmationKey(
        tenantId,
        idempotencyKey,
      );

    if (existingByIdempotencyKey) {
      return right({ appointment: existingByIdempotencyKey });
    }

    if (!paymentRef) {
      return left(new AppointmentValidationError("paymentRef is mandatory."));
    }

    if (!(paidAt instanceof Date) || Number.isNaN(paidAt.getTime())) {
      return left(new AppointmentValidationError("paidAt must be a valid Date."));
    }

    if (!externalRef && !appointmentId) {
      return left(
        new AppointmentValidationError(
          "externalRef or appointmentId must be provided.",
        ),
      );
    }

    const appointment = externalRef
      ? await this.appointmentRepository.findByExternalRef(externalRef, tenantId)
      : await this.appointmentRepository.findById(appointmentId as string, tenantId);

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status === "CONFIRMED") {
      if (appointment.paymentRef !== paymentRef) {
        return left(new AlreadyConfirmedWithOtherPaymentError());
      }

      const keyChanged = appointment.registerPaymentConfirmationKey(idempotencyKey);

      if (keyChanged) {
        await this.appointmentRepository.save(appointment);
      }

      return right({ appointment });
    }

    if (appointment.status !== "HOLD") {
      return left(
        new InvalidAppointmentStateError(
          "Only appointments in HOLD can be confirmed by payment.",
        ),
      );
    }

    const referenceDate = now ?? new Date();

    if (appointment.isHoldExpired(referenceDate)) {
      appointment.expireHold(referenceDate);
      await this.appointmentRepository.save(appointment);
      await publishAppointmentEvents(appointment, this.eventPublisher);

      return left(new HoldExpiredError());
    }

    appointment.confirmWhenPaid({
      paymentRef,
      paidAt,
      idempotencyKey,
      now: referenceDate,
    });

    await this.appointmentRepository.save(appointment);
    await publishAppointmentEvents(appointment, this.eventPublisher);

    return right({ appointment });
  }
}

