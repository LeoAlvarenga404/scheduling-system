import {
  Controller,
  Get,
  Post,
  Inject,
  Param,
  Query,
  Body,
  Headers,
} from "@nestjs/common";
import { GetAppointmentByIdUseCase } from "src/application/use-cases/get-appointment-by-id.usecase";
import { ListAppointmentsUseCase } from "src/application/use-cases/list-appointments.usecase";
import { CreateHoldAppointmentUseCase } from "src/application/use-cases/create-hold-appointment.usecase";
import { CancelAppointmentUseCase } from "src/application/use-cases/cancel-appointment.usecase";
import { RescheduleAppointmentUseCase } from "src/application/use-cases/reschedule-appointment.usecase";
import { CompleteAppointmentUseCase } from "src/application/use-cases/complete-appointment.usecase";

import { AppointmentHttpMapper } from "./appointment-http.mapper";
import type { AppointmentResponseDto } from "./appointment-response.dto";
import { ListAppointmentsQueryDto } from "./list-appointments.query.dto";
import { GetAppointmentQueryDto } from "./get-appointment.query.dto";

import { CreateHoldAppointmentDto } from "./create-hold-appointment.dto";
import { CancelAppointmentDto } from "./cancel-appointment.dto";
import { RescheduleAppointmentDto } from "./reschedule-appointment.dto";

@Controller("appointments")
export class AppointmentsController {
  constructor(
    @Inject(GetAppointmentByIdUseCase)
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    @Inject(ListAppointmentsUseCase)
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    @Inject(CreateHoldAppointmentUseCase)
    private readonly createHoldAppointmentUseCase: CreateHoldAppointmentUseCase,
    @Inject(CancelAppointmentUseCase)
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    @Inject(RescheduleAppointmentUseCase)
    private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    @Inject(CompleteAppointmentUseCase)
    private readonly completeAppointmentUseCase: CompleteAppointmentUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListAppointmentsQueryDto,
  ): Promise<{ appointments: AppointmentResponseDto[] }> {
    const response = await this.listAppointmentsUseCase.execute({
      tenantId: query.tenantId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      roomId: query.roomId,
      responsibleProfessionalId: query.responsibleProfessionalId,
      participantProfessionalId: query.participantProfessionalId,
      status: query.status,
    });

    if (response.isLeft()) {
      throw response.value;
    }

    return {
      appointments: response.value.appointments.map(
        AppointmentHttpMapper.toResponse,
      ),
    };
  }

  @Get(":appointmentId")
  async getById(
    @Param("appointmentId") appointmentId: string,
    @Query() query: GetAppointmentQueryDto,
  ): Promise<AppointmentResponseDto> {
    const response = await this.getAppointmentByIdUseCase.execute({
      appointmentId: appointmentId,
      tenantId: query.tenantId,
    });

    if (response.isLeft()) {
      throw response.value;
    }

    return AppointmentHttpMapper.toResponse(response.value.appointment);
  }

  @Post("hold")
  async createHold(
    @Body() dto: CreateHoldAppointmentDto,
    @Headers("x-tenant-id") tenantId: string,
  ): Promise<AppointmentResponseDto> {
    const response = await this.createHoldAppointmentUseCase.execute({
      ...dto,
      tenantId,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
    });

    if (response.isLeft()) {
      throw response.value;
    }

    return AppointmentHttpMapper.toResponse(response.value.appointment);
  }

  @Post(":appointmentId/cancel")
  async cancel(
    @Param("appointmentId") appointmentId: string,
    @Body() dto: CancelAppointmentDto,
    @Headers("x-tenant-id") tenantId: string,
    @Headers("x-user-id") userId?: string,
  ): Promise<void> {
    const response = await this.cancelAppointmentUseCase.execute({
      appointmentId,
      tenantId,
      reason: dto.cancelReason,
      cancelledBy: userId,
    });

    if (response.isLeft()) {
      throw response.value;
    }
  }

  @Post(":appointmentId/reschedule")
  async reschedule(
    @Param("appointmentId") appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
    @Headers("x-tenant-id") tenantId: string,
  ): Promise<AppointmentResponseDto> {
    const response = await this.rescheduleAppointmentUseCase.execute({
      appointmentId,
      tenantId,
      newStartAt: new Date(dto.newSlotStart),
      newEndAt: new Date(dto.newSlotEnd),
      newResponsibleProfessionalId: dto.professionalId,
      newRoomId: dto.roomId,
    });

    if (response.isLeft()) {
      throw response.value;
    }

    return AppointmentHttpMapper.toResponse(response.value.appointment);
  }

  @Post(":appointmentId/complete")
  async complete(
    @Param("appointmentId") appointmentId: string,
    @Headers("x-tenant-id") tenantId: string,
  ): Promise<void> {
    const response = await this.completeAppointmentUseCase.execute({
      appointmentId,
      tenantId,
    });

    if (response.isLeft()) {
      throw response.value;
    }
  }
}
