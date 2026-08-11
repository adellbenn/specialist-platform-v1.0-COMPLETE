import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class EnableTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TwoFactorLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export class TwoFactorStatusResponse {
  enabled: boolean;
  backupCodesRemaining: number;
}
