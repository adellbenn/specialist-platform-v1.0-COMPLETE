import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  VerifyTwoFactorDto,
  EnableTwoFactorDto,
  DisableTwoFactorDto,
  TwoFactorLoginDto,
} from '../two-factor.dto';

describe('Two-Factor DTOs', () => {
  describe('VerifyTwoFactorDto', () => {
    it('should pass with valid code', async () => {
      const dto = plainToInstance(VerifyTwoFactorDto, { code: '123456' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without code', async () => {
      const dto = plainToInstance(VerifyTwoFactorDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('EnableTwoFactorDto', () => {
    it('should pass with valid code', async () => {
      const dto = plainToInstance(EnableTwoFactorDto, { code: '123456' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without code', async () => {
      const dto = plainToInstance(EnableTwoFactorDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('DisableTwoFactorDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(DisableTwoFactorDto, {
        password: 'Password123!',
        code: '123456',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(DisableTwoFactorDto, { code: '123456' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without code', async () => {
      const dto = plainToInstance(DisableTwoFactorDto, {
        password: 'Password123!',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('TwoFactorLoginDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(TwoFactorLoginDto, {
        tempToken: 'temp-token-123',
        code: '123456',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without tempToken', async () => {
      const dto = plainToInstance(TwoFactorLoginDto, { code: '123456' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without code', async () => {
      const dto = plainToInstance(TwoFactorLoginDto, {
        tempToken: 'temp-token-123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
