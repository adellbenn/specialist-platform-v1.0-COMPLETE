import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionModule, PermissionAction } from '../permission.entity';

export class CreateRoleDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() priority?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() groupId?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() priority?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class CreatePermissionGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdatePermissionGroupDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UserPermissionOverrideDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() permissionId: string;
  @ApiProperty({ enum: ['granted', 'denied'] })
  @IsEnum(['granted', 'denied'] as const)
  overrideType: 'granted' | 'denied';
  @ApiProperty({ required: false }) @IsOptional() @IsString() expiresAt?: string;
}

export class BulkPermissionDto {
  @ApiProperty({ description: 'role ID' }) @IsString() roleId: string;
  @ApiProperty({ type: [String], description: 'array of permission IDs' })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
