import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from '../update-profile.dto';

describe('UpdateProfileDto', () => {
  it('should pass with no data (all optional)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid firstName', async () => {
    const dto = plainToInstance(UpdateProfileDto, { firstName: 'Ahmed' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid lastName', async () => {
    const dto = plainToInstance(UpdateProfileDto, { lastName: 'Ali' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid phone', async () => {
    const dto = plainToInstance(UpdateProfileDto, { phone: '0555555555' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid bio', async () => {
    const dto = plainToInstance(UpdateProfileDto, { bio: 'Therapist bio' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with all fields', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      firstName: 'Ahmed',
      lastName: 'Ali',
      phone: '0555555555',
      bio: 'Therapist bio',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when firstName exceeds 50 chars', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      firstName: 'A'.repeat(51),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when lastName exceeds 50 chars', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      lastName: 'A'.repeat(51),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when phone exceeds 20 chars', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      phone: '1'.repeat(21),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when bio exceeds 500 chars', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      bio: 'A'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
