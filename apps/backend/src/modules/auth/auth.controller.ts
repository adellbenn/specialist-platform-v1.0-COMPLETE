import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { TwoFactorLoginDto } from './dto/two-factor.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public, CurrentUser, SkipRbac } from '@common/decorators';
import { User } from '@modules/users/user.entity';

@ApiTags('المصادقة')
@SkipRbac()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private extractDeviceInfo(req: Request) {
    return {
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
    };
  }

  @Public()
  @Throttle({ strict: {} })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const { userAgent, ip } = this.extractDeviceInfo(req);
    const result = await this.authService.login(loginDto, userAgent, ip);
    return { data: result, message: 'تم تسجيل الدخول بنجاح' };
  }

  @Public()
  @Throttle({ strict: {} })
  @Post('2fa/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إكمال تسجيل الدخول برمز 2FA' })
  async loginTwoFactor(@Body() dto: TwoFactorLoginDto, @Req() req: Request) {
    const { userAgent, ip } = this.extractDeviceInfo(req);
    const result = await this.authService.completeTwoFactorLogin(
      dto.tempToken,
      dto.code,
      userAgent,
      ip,
    );
    return { data: result, message: 'تم تسجيل الدخول بنجاح' };
  }

  @Public()
  @Throttle({ strict: {} })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'طلب إعادة تعيين كلمة المرور' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ strict: {} })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة تعيين كلمة المرور' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تجديد رمز الوصول' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const { userAgent, ip } = this.extractDeviceInfo(req);
    const result = await this.authService.refreshToken(dto, userAgent, ip);
    return { data: result, message: 'تم تجديد الرمز بنجاح' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'بيانات المستخدم الحالي' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.authService.getProfile(user.id);
    return { data: profile };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض جميع الجلسات النشطة' })
  async getSessions(@CurrentUser() user: User) {
    const sessions = await this.authService.getActiveSessions(user.id);
    return { data: sessions };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف جلسة محددة' })
  async revokeSession(@CurrentUser() user: User, @Param('deviceId') deviceId: string) {
    await this.authService.revokeSession(user.id, deviceId);
    return { message: 'تم حذف الجلسة بنجاح' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('theme')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث تفضيل السمة (فاتح/داكن)' })
  async updateTheme(@Body() dto: UpdateThemeDto, @CurrentUser() user: User) {
    await this.authService.updateTheme(user.id, dto.theme);
    return { message: 'تم تحديث السمة' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث الملف الشخصي' })
  async updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: User) {
    const updated = await this.authService.updateProfile(user.id, dto);
    return { data: updated, message: 'تم تحديث الملف الشخصي' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل الخروج' })
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    const refreshToken = (req as any).body?.refreshToken;
    const { userAgent, ip } = this.extractDeviceInfo(req);
    await this.authService.logout(user.id, refreshToken, userAgent, ip);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل الخروج من جميع الأجهزة' })
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAll(user.id);
    return { message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير كلمة المرور' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: User) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}
