import { IsOptional, IsString, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
