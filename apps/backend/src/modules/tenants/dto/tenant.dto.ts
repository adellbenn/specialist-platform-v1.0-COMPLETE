import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TenantType, SubscriptionPlan } from '../tenant.entity';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @ApiProperty({ example: 'مركز الأمل للدعم النفسي' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'amal-center' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ enum: TenantType })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscriptionExpiresAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxBeneficiaries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class TenantQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
