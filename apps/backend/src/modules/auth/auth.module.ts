import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '@modules/users/user.entity';
import { PasswordResetToken } from './password-reset.entity';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { DeviceSessionsService } from './device-sessions/device-sessions.service';
import { KeyRotationService } from '@common/auth/key-rotation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
    TwoFactorModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, DeviceSessionsService, KeyRotationService],
  exports: [AuthService, JwtModule, KeyRotationService],
})
export class AuthModule {}
