import { IsNotEmpty, IsString } from 'class-validator';

export class GetAppointmentQueryDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
