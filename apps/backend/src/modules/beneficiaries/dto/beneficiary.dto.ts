import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender, CaseType, BeneficiaryStatus, ReferralSource } from '../beneficiary.entity';
import { GoalItem, DiagnosisItem } from '../beneficiary-file.entity';

// ─── Beneficiary ─────────────────────────────────────────────

export class CreateBeneficiaryDto {
  @ApiProperty({ example: 'أحمد' })
  @IsString()
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  firstName: string;

  @ApiProperty({ example: 'الغامدي' })
  @IsString()
  @IsNotEmpty({ message: 'اسم العائلة مطلوب' })
  lastName: string;

  @ApiPropertyOptional({ example: '2010-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender, { message: 'الجنس غير صحيح' })
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianRelationship?: string;

  @ApiPropertyOptional({ enum: ReferralSource })
  @IsOptional()
  @IsEnum(ReferralSource)
  referralSource?: ReferralSource;

  @ApiProperty({ enum: CaseType })
  @IsEnum(CaseType, { message: 'نوع الحالة غير صحيح' })
  caseType: CaseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  intakeDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedSpecialistId?: string;
}

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {
  @ApiPropertyOptional({ enum: BeneficiaryStatus })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;
}

export class BeneficiaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BeneficiaryStatus })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;

  @ApiPropertyOptional({ enum: CaseType })
  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  specialistId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class AssignSpecialistDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'معرّف الأخصائي مطلوب' })
  specialistId: string;
}

// ─── Beneficiary File ─────────────────────────────────────────

export class GoalItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  targetDate: string;

  @IsIn(['pending', 'in_progress', 'achieved', 'cancelled'])
  status: GoalItem['status'];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DiagnosisItemDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  diagnosedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBeneficiaryFileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  diagnosis?: DiagnosisItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  educationalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  assessmentResults?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalItemDto)
  goals?: GoalItemDto[];
}
