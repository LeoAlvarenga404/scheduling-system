import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

export interface ConfirmAppointmentRequest {
  appointmentId: string;
  tenantId: string;
  now?: Date;
}

export type ConfirmAppointmentOutput = Either<
  AppointmentNotFoundError | HoldExpiredError | InvalidAppointmentStateError,
  {
    appointment: Appointment;
  }
>;

export class ConfirmAppointmentUseCase
  implements UseCase<ConfirmAppointmentRequest, ConfirmAppointmentOutput>
{
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    appointmentId,
    tenantId,
    now,
  }: ConfirmAppointmentRequest): Promise<ConfirmAppointmentOutput> {
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status === "CONFIRMED") {
      return right({ appointment });
    }

    if (appointment.status !== "HOLD") {
      return left(
        new InvalidAppointmentStateError(
          "Only appointments in HOLD can be confirmed.",
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

    appointment.confirm(referenceDate);
    await this.appointmentRepository.save(appointment);
    await publishAppointmentEvents(appointment, this.eventPublisher);

    return right({ appointment });
  }
}

