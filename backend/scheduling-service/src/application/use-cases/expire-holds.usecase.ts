import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import type { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

export interface ExpireHoldsRequest {
  tenantId?: string;
  now?: Date;
}

export type ExpireHoldsOutput = Either<
  never,
  {
    expiredAppointments: Appointment[];
  }
>;

export class ExpireHoldsUseCase
  implements UseCase<ExpireHoldsRequest, ExpireHoldsOutput>
{
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    tenantId,
    now,
  }: ExpireHoldsRequest): Promise<ExpireHoldsOutput> {
    const referenceDate = now ?? new Date();
    const appointmentsToExpire = await this.appointmentRepository.listExpiredHolds(
      referenceDate,
      tenantId,
    );

    const expiredAppointments: Appointment[] = [];

    for (const appointment of appointmentsToExpire) {
      const expired = appointment.expireHold(referenceDate);

      if (!expired) {
        continue;
      }

      await this.appointmentRepository.save(appointment);
      await publishAppointmentEvents(appointment, this.eventPublisher);
      expiredAppointments.push(appointment);
    }

    return right({ expiredAppointments });
  }
}

