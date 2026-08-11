import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../invoice.entity';

// ─── Service Package ──────────────────────────────────────────

export class CreatePackageDto {
  @ApiProperty({ example: 'باقة 10 جلسات' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  sessionsCount: number;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Subscription ─────────────────────────────────────────────

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  beneficiaryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  sessionsCount: number;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  expiryDate: string;
}

export class SubscriptionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ─── Invoice ──────────────────────────────────────────────────

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  beneficiaryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvoiceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

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

export class MarkPaidDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
