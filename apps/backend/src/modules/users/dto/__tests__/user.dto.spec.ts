import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../user.dto';
import { UserRole } from '../../user.entity';

describe('User DTOs', () => {
  describe('CreateUserDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without email', async () => {
      const dto = plainToInstance(CreateUserDto, {
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'not-an-email',
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with password shorter than 8 chars', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: '1234567',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without firstName', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without lastName', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'Ahmed',
        role: UserRole.SPECIALIST,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without role', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid role enum', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: 'invalid_role',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'Ahmed',
        lastName: 'Ali',
        role: UserRole.SPECIALIST,
        phone: '0555555555',
        roleId: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateUserDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(UpdateUserDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept partial data', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        firstName: 'Updated',
        role: UserRole.CENTER_MANAGER,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UserQueryDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(UserQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(UserQueryDto, {
        search: 'ahmed',
        role: UserRole.SPECIALIST,
        isActive: true,
        page: 1,
        limit: 20,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
