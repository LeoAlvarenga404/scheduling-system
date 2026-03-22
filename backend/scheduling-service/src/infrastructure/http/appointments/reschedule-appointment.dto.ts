import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class RescheduleAppointmentDto {
  @IsDateString()
  newSlotStart: string;

  @IsDateString()
  newSlotEnd: string;

  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @IsUUID()
  roomId: string;
}
