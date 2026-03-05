import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import { IdempotencyKeyRequiredError } from "src/domain/errors/idempotency-key-required.error";
import { SchedulingConflictsError } from "src/domain/errors/scheduling-conflicts.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";

export interface CreateHoldAppointmentRequest {
  tenantId: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  responsibleProfessionalId: string;
  participantProfessionalIds?: string[];
  customerId?: string;
  externalRef?: string;
  holdTtlSeconds: number;
  idempotencyKey: string;
  now?: Date;
}

export type CreateHoldAppointmentOutput = Either<
  | AppointmentValidationError
  | IdempotencyKeyRequiredError
  | SchedulingConflictsError,
  {
    appointment: Appointment;
  }
>;

const CREATE_HOLD_OPERATION = "CREATE_HOLD_APPOINTMENT";

export class CreateHoldAppointmentUseCase implements UseCase<
  CreateHoldAppointmentRequest,
  CreateHoldAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    tenantId,
    roomId,
    startAt,
    endAt,
    responsibleProfessionalId,
    participantProfessionalIds,
    customerId,
    externalRef,
    holdTtlSeconds,
    idempotencyKey,
    now,
  }: CreateHoldAppointmentRequest): Promise<CreateHoldAppointmentOutput> {
    if (!idempotencyKey) {
      return left(new IdempotencyKeyRequiredError());
    }

    const idempotencyRecord =
      await this.appointmentRepository.findIdempotencyRecord<{
        appointment: Appointment;
      }>({
        tenantId,
        key: idempotencyKey,
        operation: CREATE_HOLD_OPERATION,
      });

    if (idempotencyRecord) {
      return right(idempotencyRecord.responseSnapshot);
    }

    if (!Number.isInteger(holdTtlSeconds) || holdTtlSeconds <= 0) {
      return left(
        new AppointmentValidationError(
          "holdTtlSeconds must be a positive integer.",
        ),
      );
    }

    const referenceDate = now ?? new Date();
    const holdExpiresAt = new Date(
      referenceDate.getTime() + holdTtlSeconds * 1000,
    );
    const normalizedParticipants =
      Appointment.normalizeParticipantProfessionalIds(
        participantProfessionalIds,
        responsibleProfessionalId,
      );

    let appointment: Appointment;

    try {
      appointment = Appointment.create({
        tenantId,
        roomId,
        startAt,
        endAt,
        status: AppointmentStatus.create("HOLD"),
        responsibleProfessionalId,
        participantProfessionalIds: normalizedParticipants,
        customerId,
        externalRef,
        holdExpiresAt,
      });
    } catch (error) {
      return left(
        error instanceof AppointmentValidationError
          ? error
          : new AppointmentValidationError("Invalid appointment payload."),
      );
    }

    const conflictType =
      await this.appointmentRepository.createAppointmentIfNoConflicts(
        appointment,
      );

    if (conflictType) {
      return left(new SchedulingConflictsError(conflictType));
    }

    const responseSnapshot = { appointment };

    await this.appointmentRepository.saveIdempotencyRecord({
      tenantId,
      key: idempotencyKey,
      operation: CREATE_HOLD_OPERATION,
      responseSnapshot,
      createdAt: referenceDate,
    });

    return right(responseSnapshot);
  }
}
