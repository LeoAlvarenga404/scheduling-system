import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

export interface CompleteAppointmentRequest {
  appointmentId: string;
  tenantId: string;
}

export type CompleteAppointmentOutput = Either<
  AppointmentNotFoundError | InvalidAppointmentStateError,
  {
    appointment: Appointment;
  }
>;

export class CompleteAppointmentUseCase
  implements UseCase<CompleteAppointmentRequest, CompleteAppointmentOutput>
{
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    appointmentId,
    tenantId,
  }: CompleteAppointmentRequest): Promise<CompleteAppointmentOutput> {
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status === "COMPLETED") {
      return right({ appointment });
    }

    if (appointment.status !== "CONFIRMED") {
      return left(
        new InvalidAppointmentStateError(
          "Only CONFIRMED appointments can be completed.",
        ),
      );
    }

    appointment.complete();
    await this.appointmentRepository.save(appointment);
    await publishAppointmentEvents(appointment, this.eventPublisher);

    return right({ appointment });
  }
}

