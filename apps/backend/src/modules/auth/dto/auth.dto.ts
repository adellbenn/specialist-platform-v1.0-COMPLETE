import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@clinic.com', description: 'البريد الإلكتروني' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'كلمة المرور' })
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'رمز التحديث' })
  @IsString()
  @IsNotEmpty({ message: 'رمز التحديث مطلوب' })
  refreshToken: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
  requiresTwoFactor?: boolean;
  tempToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string | null;
    avatarUrl: string | null;
  };
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@platform.com', description: 'البريد الإلكتروني' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'رمز إعادة التعيين' })
  @IsString()
  @IsNotEmpty({ message: 'الرمز مطلوب' })
  token: string;

  @ApiProperty({ example: 'NewPass@123', description: 'كلمة المرور الجديدة' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123', description: 'كلمة المرور الحالية' })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة' })
  currentPassword: string;

  @ApiProperty({ example: 'NewPass@123', description: 'كلمة المرور الجديدة' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  newPassword: string;
}
