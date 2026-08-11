import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../auth.dto';
import { UpdateThemeDto } from '../update-theme.dto';

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'admin@clinic.com',
        password: 'Password123!',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without email', async () => {
      const dto = plainToInstance(LoginDto, { password: 'Password123!' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: 'Password123!',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(LoginDto, { email: 'admin@clinic.com' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with password shorter than 6 chars', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'admin@clinic.com',
        password: '12345',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RefreshTokenDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(RefreshTokenDto, {
        refreshToken: 'some-refresh-token',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without refreshToken', async () => {
      const dto = plainToInstance(RefreshTokenDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('should pass with valid email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'admin@platform.com',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'not-an-email',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ResetPasswordDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'reset-token-123',
        password: 'NewPass@123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without token', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        password: 'NewPass@123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'reset-token-123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with password shorter than 6 chars', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'reset-token-123',
        password: '12345',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ChangePasswordDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without currentPassword', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        newPassword: 'NewPass@456',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without newPassword', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPass@123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with newPassword shorter than 6 chars', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPass@123',
        newPassword: '12345',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateThemeDto', () => {
    it('should pass with light', async () => {
      const dto = plainToInstance(UpdateThemeDto, { theme: 'light' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with dark', async () => {
      const dto = plainToInstance(UpdateThemeDto, { theme: 'dark' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with system', async () => {
      const dto = plainToInstance(UpdateThemeDto, { theme: 'system' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid theme', async () => {
      const dto = plainToInstance(UpdateThemeDto, { theme: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
