import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

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
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({ tenantId, now }: ExpireHoldsRequest): Promise<ExpireHoldsOutput> {
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

      await this.appointmentRepository.updateAppointment(appointment);
      expiredAppointments.push(appointment);
    }

    return right({ expiredAppointments });
  }
}
