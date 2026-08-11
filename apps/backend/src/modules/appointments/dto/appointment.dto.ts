import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '../appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'المستفيد مطلوب' })
  beneficiaryId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'الأخصائي مطلوب' })
  specialistId: string;

  @ApiProperty({ example: '2026-06-15T10:00:00' })
  @IsDateString()
  @IsNotEmpty({ message: 'موعد الجلسة مطلوب' })
  scheduledAt: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class AppointmentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  specialistId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  /** YYYY-MM-DD — بداية النطاق الزمني */
  @ApiPropertyOptional()
  @IsOptional()
  dateFrom?: string;

  /** YYYY-MM-DD — نهاية النطاق الزمني */
  @ApiPropertyOptional()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
