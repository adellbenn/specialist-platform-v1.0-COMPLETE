import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ReportType, ReportStatus } from '../report.entity';

export class CreateReportDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'المستفيد مطلوب' })
  beneficiaryId: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType, { message: 'نوع التقرير غير صحيح' })
  type: ReportType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'عنوان التقرير مطلوب' })
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sharedWithBeneficiary?: boolean;
}

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class ReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  specialistId?: string;

  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class ApproveReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
