import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '@common/decorators';
import { User } from '@modules/users/user.entity';
import {
  EnableTwoFactorDto,
  DisableTwoFactorDto,
} from '../dto/two-factor.dto';

@ApiTags('المصادقة الثنائية')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret + QR code URL' })
  async generate(@CurrentUser() user: User) {
    const result = await this.twoFactorService.generateSecret(user.id);
    return { data: result, message: 'Scan the QR code with your authenticator app' };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code and enable 2FA' })
  async verifyAndEnable(@CurrentUser() user: User, @Body() dto: EnableTwoFactorDto) {
    await this.twoFactorService.verifyAndEnable(user.id, dto.code);
    return { message: '2FA enabled successfully' };
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable(@CurrentUser() user: User, @Body() dto: DisableTwoFactorDto) {
    await this.twoFactorService.disable(user.id, dto.password, dto.code);
    return { message: '2FA disabled successfully' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 2FA status' })
  async status(@CurrentUser() user: User) {
    return this.twoFactorService.getStatus(user.id);
  }
}
