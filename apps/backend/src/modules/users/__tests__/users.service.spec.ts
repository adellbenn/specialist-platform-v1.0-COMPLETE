import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { User, UserRole } from '../user.entity';
import { Role } from '@modules/permissions/role.entity';
import { PermissionsService } from '@modules/permissions/permissions.service';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(() => ({
      toString: jest.fn().mockReturnValue('dev-admin-password'),
    })),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let roleRepo: any;
  let permissionsService: any;

  const mockUser = (overrides: any = {}): any => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '123',
    bio: 'bio',
    passwordHash: '$2b$12$hashed',
    role: UserRole.SPECIALIST,
    roleId: 'role-1',
    tenantId: 'tenant-1',
    isActive: true,
    mustChangePassword: false,
    preferences: { theme: 'dark' },
    validatePassword: jest.fn().mockResolvedValue(true),
    tenant: { id: 'tenant-1', name: 'T' },
    assignedRole: { id: 'role-1', name: 'specialist' },
    ...overrides,
  });

  beforeEach(async () => {
    userRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    roleRepo = {
      findOne: jest.fn(),
    };

    permissionsService = {
      seedPermissions: jest.fn(),
      seedRolesFromMap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.spyOn(User, 'hashPassword').mockResolvedValue('$2b$12$newhash');
  });

  afterEach(() => jest.restoreAllMocks());

  describe('onModuleInit (seed)', () => {
    it('should skip seeding if users already exist', async () => {
      userRepo.count.mockResolvedValue(5);

      await service.onModuleInit();

      expect(permissionsService.seedPermissions).not.toHaveBeenCalled();
    });

    it('should seed admin user if no users exist (dev mode)', async () => {
      userRepo.count.mockResolvedValue(0);
      permissionsService.seedPermissions.mockResolvedValue(undefined);
      permissionsService.seedRolesFromMap.mockResolvedValue([
        { id: 'role-1', name: 'super_admin' },
      ]);
      userRepo.save.mockResolvedValue({});

      const originalEnv = process.env.NODE_ENV;
      const originalEmail = process.env.SUPER_ADMIN_EMAIL;
      const originalPassword = process.env.SUPER_ADMIN_PASSWORD;
      process.env.NODE_ENV = 'development';
      delete process.env.SUPER_ADMIN_EMAIL;
      delete process.env.SUPER_ADMIN_PASSWORD;

      await service.onModuleInit();

      expect(permissionsService.seedPermissions).toHaveBeenCalled();
      expect(permissionsService.seedRolesFromMap).toHaveBeenCalledWith(undefined);
      expect(userRepo.save).toHaveBeenCalled();
      expect(User.hashPassword).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      if (originalEmail) process.env.SUPER_ADMIN_EMAIL = originalEmail;
      if (originalPassword) process.env.SUPER_ADMIN_PASSWORD = originalPassword;
    });

    it('should throw in production if SUPER_ADMIN_PASSWORD not set', async () => {
      userRepo.count.mockResolvedValue(0);
      permissionsService.seedPermissions.mockResolvedValue(undefined);
      permissionsService.seedRolesFromMap.mockResolvedValue([]);

      const originalEnv = process.env.NODE_ENV;
      const originalPassword = process.env.SUPER_ADMIN_PASSWORD;
      process.env.NODE_ENV = 'production';
      delete process.env.SUPER_ADMIN_PASSWORD;

      await expect(service.onModuleInit()).rejects.toThrow('SUPER_ADMIN_PASSWORD must be set');

      process.env.NODE_ENV = originalEnv;
      if (originalPassword) process.env.SUPER_ADMIN_PASSWORD = originalPassword;
    });

    it('should use provided SUPER_ADMIN_PASSWORD in dev', async () => {
      userRepo.count.mockResolvedValue(0);
      permissionsService.seedPermissions.mockResolvedValue(undefined);
      permissionsService.seedRolesFromMap.mockResolvedValue([]);
      userRepo.save.mockResolvedValue({});

      const originalEnv = process.env.NODE_ENV;
      const originalPassword = process.env.SUPER_ADMIN_PASSWORD;
      process.env.NODE_ENV = 'development';
      process.env.SUPER_ADMIN_PASSWORD = 'provided-password';

      await service.onModuleInit();

      expect(User.hashPassword).toHaveBeenCalledWith('provided-password');

      process.env.NODE_ENV = originalEnv;
      if (originalPassword) process.env.SUPER_ADMIN_PASSWORD = originalPassword;
      else delete process.env.SUPER_ADMIN_PASSWORD;
    });
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      await expect(
        service.create(
          { email: 'test@example.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST },
          UserRole.SPECIALIST,
          'tenant-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if non-super_admin creates super_admin', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SUPER_ADMIN },
          UserRole.CENTER_MANAGER,
          'tenant-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow super_admin to create super_admin', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser());
      userRepo.save.mockResolvedValue(mockUser());

      const result = await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SUPER_ADMIN },
        UserRole.SUPER_ADMIN,
        'tenant-1',
      );

      expect(result).toBeDefined();
    });

    it('should set tenant from creator when not super_admin', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockResolvedValue(mockUser());

      await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST },
        UserRole.CENTER_MANAGER,
        'tenant-1',
      );

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1' }),
      );
    });

    it('should use dto.tenantId when creator is super_admin', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockResolvedValue(mockUser());

      await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST, tenantId: 'tenant-2' },
        UserRole.SUPER_ADMIN,
        'tenant-1',
      );

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-2' }),
      );
    });

    it('should resolve roleId from role name if not provided', async () => {
      userRepo.findOne.mockResolvedValueOnce(null); // email check
      roleRepo.findOne.mockResolvedValue({ id: 'role-resolved' }); // role lookup
      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockResolvedValue(mockUser());

      await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST },
        UserRole.SPECIALIST,
        'tenant-1',
      );

      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: UserRole.SPECIALIST } });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'role-resolved' }),
      );
    });

    it('should use provided roleId if given', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockResolvedValue(mockUser());

      await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST, roleId: 'explicit-role' },
        UserRole.SPECIALIST,
        'tenant-1',
      );

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'explicit-role' }),
      );
    });

    it('should hash password via User.hashPassword', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockResolvedValue(mockUser());

      await service.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST },
        UserRole.SPECIALIST,
        'tenant-1',
      );

      expect(User.hashPassword).toHaveBeenCalledWith('pass');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: '$2b$12$newhash' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      userRepo.findAndCount.mockResolvedValue([[mockUser()], 1]);

      const result = await service.findAll(
        { page: 1, limit: 20 },
        'tenant-1',
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'test', page: 1, limit: 10 }, 'tenant-1');

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.where).toHaveLength(3); // firstName, lastName, email
    });

    it('should apply role filter', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ role: UserRole.SPECIALIST, page: 1, limit: 10 }, 'tenant-1');

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.where.role).toBe(UserRole.SPECIALIST);
    });

    it('should apply isActive filter', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: false, page: 1, limit: 10 }, 'tenant-1');

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.where.isActive).toBe(false);
    });

    it('should default to page 1 and limit 20', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({}, 'tenant-1');

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.skip).toBe(0);
      expect(options.take).toBe(20);
    });

    it('should handle pagination offsets correctly', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 10 }, 'tenant-1');

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.skip).toBe(20);
      expect(options.take).toBe(10);
    });

    it('should handle missing tenantId', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 });

      const options = userRepo.findAndCount.mock.calls[0][0];
      expect(options.where.tenantId).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      const result = await service.findOne('user-1', 'tenant-1');

      expect(result.id).toBe('user-1');
    });

    it('should throw NotFoundException if not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should include tenantId in where when provided', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      await service.findOne('user-1', 'tenant-1');

      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1', tenantId: 'tenant-1' },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      userRepo.save.mockResolvedValue(mockUser());

      const result = await service.update('user-1', {
        firstName: 'New',
        lastName: 'Name',
      });

      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should hash password when provided', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      userRepo.save.mockResolvedValue(mockUser());

      await service.update('user-1', { password: 'newpass' });

      expect(User.hashPassword).toHaveBeenCalledWith('newpass');
    });

    it('should throw ConflictException on duplicate email', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockUser()) // findOne for user
        .mockResolvedValueOnce(mockUser({ email: 'taken@example.com' })); // email check

      await expect(
        service.update('user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow same email (no conflict)', async () => {
      const user = mockUser({ email: 'same@example.com' });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.update('user-1', { email: 'same@example.com' });

      // Only one findOne call (for user lookup, not email conflict check)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should update role and resolve roleId', async () => {
      const user = mockUser({ role: UserRole.SPECIALIST });
      userRepo.findOne.mockResolvedValue(user);
      roleRepo.findOne.mockResolvedValue({ id: 'new-role-id' });
      userRepo.save.mockResolvedValue(user);

      await service.update('user-1', { role: UserRole.CENTER_MANAGER });

      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: UserRole.CENTER_MANAGER } });
      expect(user.roleId).toBe('new-role-id');
    });

    it('should not update roleId if role unchanged', async () => {
      const user = mockUser({ role: UserRole.SPECIALIST });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.update('user-1', { role: UserRole.SPECIALIST });

      expect(roleRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const user = mockUser({ isActive: true });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, isActive: false });

      const result = await service.toggleActive('user-1');

      expect(user.isActive).toBe(false);
    });

    it('should toggle from inactive to active', async () => {
      const user = mockUser({ isActive: false });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, isActive: true });

      const result = await service.toggleActive('user-1');

      expect(user.isActive).toBe(true);
    });
  });

  describe('remove', () => {
    it('should soft-delete user', async () => {
      const user = mockUser({ isActive: true });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.remove('user-1');

      expect(user.isActive).toBe(false);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      userRepo.findOne.mockResolvedValue(mockUser({ preferences: { lang: 'ar' } }));

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({ lang: 'ar' });
    });

    it('should return empty object if no preferences', async () => {
      userRepo.findOne.mockResolvedValue(mockUser({ preferences: null }));

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({});
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getPreferences('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePreferences', () => {
    it('should merge preferences', async () => {
      const user = mockUser({ preferences: { lang: 'ar' } });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.updatePreferences('user-1', { theme: 'dark' });

      expect(result).toEqual({ lang: 'ar', theme: 'dark' });
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePreferences('user-1', { theme: 'dark' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty preferences on user', async () => {
      const user = mockUser({ preferences: null });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.updatePreferences('user-1', { key: 'val' });

      expect(result).toEqual({ key: 'val' });
    });
  });
});
