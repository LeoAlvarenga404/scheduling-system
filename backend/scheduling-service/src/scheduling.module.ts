import { Module } from "@nestjs/common";
import { AppointmentRepository } from "./domain/repositories/appointment.repository";
import { PrismaModule } from "./infrastructure/database/prisma/prisma.module";
import { PrismaAppointmentRepository } from "./infrastructure/database/prisma/repositories/prisma-appointment.repository";
import { AppointmentsController } from "./infrastructure/http/appointments/appointments.controller";
import { HealthController } from "./infrastructure/http/health.controller";

import { schedulingUseCaseProviders } from "./scheduling.providers";

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, AppointmentsController],
  providers: [
    PrismaAppointmentRepository,
    {
      provide: AppointmentRepository,
      useExisting: PrismaAppointmentRepository,
    },
    ...schedulingUseCaseProviders,
  ],
})
export class SchedulingModule {}
