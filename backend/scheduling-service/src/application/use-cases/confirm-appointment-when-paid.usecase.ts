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

const CONFIRM_WHEN_PAID_OPERATION = "CONFIRM_APPOINTMENT_WHEN_PAID";

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
    UseCase<
      ConfirmAppointmentWhenPaidRequest,
      ConfirmAppointmentWhenPaidOutput
    >
{
  constructor(private appointmentRepository: AppointmentRepository) {}

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

    const idempotencyRecord =
      await this.appointmentRepository.findIdempotencyRecord<{
        appointment: Appointment;
      }>({
        tenantId,
        key: idempotencyKey,
        operation: CONFIRM_WHEN_PAID_OPERATION,
      });

    if (idempotencyRecord) {
      return right(idempotencyRecord.responseSnapshot);
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
      ? await this.appointmentRepository.getAppointmentByExternalRef(
          externalRef,
          tenantId,
        )
      : await this.appointmentRepository.getAppointmentById(
          appointmentId as string,
          tenantId,
        );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status.value === "CONFIRMED") {
      if (appointment.paymentRef !== paymentRef) {
        return left(new AlreadyConfirmedWithOtherPaymentError());
      }

      const responseSnapshot = { appointment };

      await this.appointmentRepository.saveIdempotencyRecord({
        tenantId,
        key: idempotencyKey,
        operation: CONFIRM_WHEN_PAID_OPERATION,
        responseSnapshot,
        createdAt: now ?? new Date(),
      });

      return right(responseSnapshot);
    }

    if (appointment.status.value !== "HOLD") {
      return left(
        new InvalidAppointmentStateError(
          "Only appointments in HOLD can be confirmed by payment.",
        ),
      );
    }

    const referenceDate = now ?? new Date();

    if (appointment.isHoldExpired(referenceDate)) {
      appointment.expireHold(referenceDate);
      await this.appointmentRepository.updateAppointment(appointment);

      return left(new HoldExpiredError());
    }

    appointment.confirmWhenPaid({ paymentRef, paidAt, now: referenceDate });
    await this.appointmentRepository.updateAppointment(appointment);

    const responseSnapshot = { appointment };

    await this.appointmentRepository.saveIdempotencyRecord({
      tenantId,
      key: idempotencyKey,
      operation: CONFIRM_WHEN_PAID_OPERATION,
      responseSnapshot,
      createdAt: referenceDate,
    });

    return right(responseSnapshot);
  }
}
