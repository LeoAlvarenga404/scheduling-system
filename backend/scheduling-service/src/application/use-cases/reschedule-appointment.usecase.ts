import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { SchedulingConflictsError } from "src/domain/errors/scheduling-conflicts.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  tenantId: string;
  newRoomId: string;
  newStartAt: Date;
  newEndAt: Date;
  newResponsibleProfessionalId?: string;
  newParticipantProfessionalIds?: string[];
  newHoldTtlSeconds?: number;
  now?: Date;
}

export type RescheduleAppointmentOutput = Either<
  | AppointmentNotFoundError
  | AppointmentValidationError
  | InvalidAppointmentStateError
  | SchedulingConflictsError,
  {
    appointment: Appointment;
  }
>;

const RESCHEDULE_DEFAULT_HOLD_TTL_SECONDS = 600;

export class RescheduleAppointmentUseCase implements UseCase<
  RescheduleAppointmentRequest,
  RescheduleAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    appointmentId,
    tenantId,
    newRoomId,
    newStartAt,
    newEndAt,
    newResponsibleProfessionalId,
    newParticipantProfessionalIds,
    newHoldTtlSeconds,
    now,
  }: RescheduleAppointmentRequest): Promise<RescheduleAppointmentOutput> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (
      appointment.status.value !== "HOLD" &&
      appointment.status.value !== "CONFIRMED"
    ) {
      return left(
        new InvalidAppointmentStateError(
          "Only HOLD or CONFIRMED appointments can be rescheduled.",
        ),
      );
    }

    if (newHoldTtlSeconds !== undefined && newHoldTtlSeconds <= 0) {
      return left(
        new AppointmentValidationError(
          "newHoldTtlSeconds must be greater than zero.",
        ),
      );
    }

    const responsibleProfessionalId =
      newResponsibleProfessionalId ??
      appointment.responsibleProfessionalId.value;
    const normalizedParticipants =
      Appointment.normalizeParticipantProfessionalIds(
        newParticipantProfessionalIds ?? appointment.participantProfessionalIds,
        responsibleProfessionalId,
      );

    const conflictResult = await this.appointmentRepository.findConflicts({
      tenantId,
      roomId: newRoomId,
      startAt: newStartAt,
      endAt: newEndAt,
      professionalIds: [
        responsibleProfessionalId,
        ...(normalizedParticipants ?? []),
      ],
      excludeAppointmentId: appointment.id.toString(),
    });

    if (conflictResult.roomConflict) {
      return left(new SchedulingConflictsError("CONFLICT_ROOM"));
    }

    if (conflictResult.professionalConflict) {
      return left(new SchedulingConflictsError("CONFLICT_PROFESSIONAL"));
    }

    const referenceDate = now ?? new Date();
    const holdTtlSeconds =
      newHoldTtlSeconds ?? RESCHEDULE_DEFAULT_HOLD_TTL_SECONDS;
    const holdExpiresAt = new Date(
      referenceDate.getTime() + holdTtlSeconds * 1000,
    );

    try {
      appointment.reschedule({
        roomId: newRoomId,
        startAt: newStartAt,
        endAt: newEndAt,
        responsibleProfessionalId,
        participantProfessionalIds: normalizedParticipants,
        resetToHold: true,
        holdExpiresAt,
      });
    } catch (error) {
      return left(
        error instanceof AppointmentValidationError
          ? error
          : new AppointmentValidationError("Invalid reschedule data."),
      );
    }

    await this.appointmentRepository.updateAppointment(appointment);

    return right({ appointment });
  }
}
