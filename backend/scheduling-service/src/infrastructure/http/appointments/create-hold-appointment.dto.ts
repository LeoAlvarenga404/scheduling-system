import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  IsArray,
} from "class-validator";

export class CreateHoldAppointmentDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  roomId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsUUID()
  responsibleProfessionalId: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  participantProfessionalIds?: string[];

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsNumber()
  holdTtlSeconds: number;
}
