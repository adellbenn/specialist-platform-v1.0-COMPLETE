import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AttendanceStatus } from '../session.entity';

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  beneficiaryId: string;

  @ApiProperty()
  @IsUUID()
  specialistId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty()
  @IsDateString()
  startedAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualDurationMinutes?: number;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendance?: AttendanceStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  moodAssessment?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  objectivesMet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interventionsUsed?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeworkAssigned?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextSessionPlan?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}

export class SessionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  specialistId?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendance?: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  dateFrom?: string;

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
