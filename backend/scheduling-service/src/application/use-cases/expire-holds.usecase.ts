import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import type { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";
import { RedisService } from "src/infrastructure/database/redis/redis.service";

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
    private readonly redisService: RedisService,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    tenantId,
    now,
  }: ExpireHoldsRequest): Promise<ExpireHoldsOutput> {
    const actualTenantId = tenantId || "default"; // Needed a tenantId to use for locking safely
    const lockKey = `expire_holds_lock:${actualTenantId}`;
    
    const acquired = await this.redisService.acquireLock(lockKey, 30000); // 30s lock
    if (!acquired) {
      return right({ expiredAppointments: [] }); // Lock busy, skip this tick
    }

    try {
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
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }
}

