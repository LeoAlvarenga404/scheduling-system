import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { GetAppointmentByIdUseCase } from "src/application/use-cases/get-appointment-by-id.usecase";
import { ListAppointmentsUseCase } from "src/application/use-cases/list-appointments.usecase";
import type { AppointmentStatus } from "src/domain/entities/appointment.types";
import { AppointmentHttpMapper } from "./appointment-http.mapper";
import type { AppointmentResponseDto } from "./appointment-response.dto";

type QueryValue = string | string[] | undefined;

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "HOLD",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
];

@Controller("appointments")
export class AppointmentsController {
  constructor(
    @Inject(GetAppointmentByIdUseCase)
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    @Inject(ListAppointmentsUseCase)
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: Record<string, QueryValue>,
  ): Promise<{ appointments: AppointmentResponseDto[] }> {
    const response = await this.listAppointmentsUseCase.execute({
      tenantId: this.requireSingleString(query.tenantId, "tenantId"),
      dateFrom: this.parseOptionalDate(query.dateFrom, "dateFrom"),
      dateTo: this.parseOptionalDate(query.dateTo, "dateTo"),
      roomId: this.parseOptionalString(query.roomId, "roomId"),
      responsibleProfessionalId: this.parseOptionalString(
        query.responsibleProfessionalId,
        "responsibleProfessionalId",
      ),
      participantProfessionalId: this.parseOptionalString(
        query.participantProfessionalId,
        "participantProfessionalId",
      ),
      status: this.parseOptionalStatus(query.status),
    });

    if (response.isLeft()) {
      throw new BadRequestException(response.value.message);
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
    @Query("tenantId") tenantId: string,
  ): Promise<AppointmentResponseDto> {
    const response = await this.getAppointmentByIdUseCase.execute({
      appointmentId: this.requireNonEmptyString(appointmentId, "appointmentId"),
      tenantId: this.requireNonEmptyString(tenantId, "tenantId"),
    });

    if (response.isLeft()) {
      throw new NotFoundException(response.value.message);
    }

    return AppointmentHttpMapper.toResponse(response.value.appointment);
  }

  private parseOptionalString(
    value: QueryValue,
    fieldName: string,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.requireSingleString(value, fieldName);
  }

  private parseOptionalDate(
    value: QueryValue,
    fieldName: string,
  ): Date | undefined {
    if (value === undefined) {
      return undefined;
    }

    const rawValue = this.requireSingleString(value, fieldName);
    const parsedDate = new Date(rawValue);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date.`);
    }

    return parsedDate;
  }

  private parseOptionalStatus(
    value: QueryValue,
  ): AppointmentStatus | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValue = this.requireSingleString(value, "status");

    if (!APPOINTMENT_STATUSES.includes(normalizedValue as AppointmentStatus)) {
      throw new BadRequestException(
        `status must be one of: ${APPOINTMENT_STATUSES.join(", ")}.`,
      );
    }

    return normalizedValue as AppointmentStatus;
  }

  private requireSingleString(value: QueryValue, fieldName: string): string {
    if (Array.isArray(value)) {
      throw new BadRequestException(`${fieldName} must be provided only once.`);
    }

    return this.requireNonEmptyString(value, fieldName);
  }

  private requireNonEmptyString(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
  }
}
