import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import { SchedulingConflictsError } from "src/domain/errors/scheduling-conflicts.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

export interface CreateHoldAppointmentRequest {
  tenantId: string;
  roomId: string;
  serviceId: string;
  amount: number;
  currency?: string;
  startAt: Date;
  endAt: Date;
  responsibleProfessionalId: string;
  participantProfessionalIds?: string[];
  customerId?: string;
  externalRef?: string;
  holdTtlSeconds: number;
  now?: Date;
}

export type CreateHoldAppointmentOutput = Either<
  AppointmentValidationError | SchedulingConflictsError,
  {
    appointment: Appointment;
  }
>;

export class CreateHoldAppointmentUseCase
  implements UseCase<CreateHoldAppointmentRequest, CreateHoldAppointmentOutput>
{
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    tenantId,
    roomId,
    serviceId,
    amount,
    currency,
    startAt,
    endAt,
    responsibleProfessionalId,
    participantProfessionalIds,
    customerId,
    externalRef,
    holdTtlSeconds,
    now,
  }: CreateHoldAppointmentRequest): Promise<CreateHoldAppointmentOutput> {
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

    let appointment: Appointment;

    try {
      appointment = Appointment.create({
        tenantId,
        roomId,
        serviceId,
        amount,
        currency,
        startAt,
        endAt,
        status: "HOLD",
        responsibleProfessionalId,
        participantProfessionalIds,
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

    const conflictType = await this.appointmentRepository.createIfNoConflicts(
      appointment,
    );

    if (conflictType) {
      return left(new SchedulingConflictsError(conflictType));
    }

    await publishAppointmentEvents(appointment, this.eventPublisher);

    return right({ appointment });
  }
}

