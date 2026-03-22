import { IsOptional, IsString, IsDateString, IsIn, IsNotEmpty } from 'class-validator';
import type { AppointmentStatus } from 'src/domain/entities/appointment.types';

const APPOINTMENT_STATUSES = [
  "HOLD",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
];

export class ListAppointmentsQueryDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  responsibleProfessionalId?: string;

  @IsOptional()
  @IsString()
  participantProfessionalId?: string;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;
}
