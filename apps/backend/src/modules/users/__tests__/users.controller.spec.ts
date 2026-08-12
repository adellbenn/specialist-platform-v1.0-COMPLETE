import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { UserRole } from '../user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  const mockUser: any = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.SPECIALIST,
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      toggleActive: jest.fn(),
      remove: jest.fn(),
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
    };

    controller = new UsersController(usersService);
  });

  describe('create', () => {
    it('should call usersService.create with correct params', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST } as any,
        mockUser,
        'tenant-1',
      );

      expect(usersService.create).toHaveBeenCalledWith(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', role: UserRole.SPECIALIST },
        UserRole.SPECIALIST,
        'tenant-1',
      );
      expect(result.data).toEqual(mockUser);
      expect(result.message).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll', async () => {
      usersService.findAll.mockResolvedValue({ data: [mockUser], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } });

      const result = await controller.findAll({ page: 1, limit: 20 } as any, 'tenant-1');

      expect(usersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 }, 'tenant-1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1', 'tenant-1');

      expect(usersService.findOne).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should call usersService.update', async () => {
      const updated = { ...mockUser, firstName: 'New' };
      usersService.update.mockResolvedValue(updated);

      const result = await controller.update('user-1', { firstName: 'New' } as any, 'tenant-1', mockUser);

      expect(usersService.update).toHaveBeenCalledWith('user-1', { firstName: 'New' }, 'tenant-1', mockUser);
      expect(result.data).toEqual(updated);
      expect(result.message).toBeDefined();
    });
  });

  describe('toggleActive', () => {
    it('should return activation message when activated', async () => {
      usersService.toggleActive.mockResolvedValue({ ...mockUser, isActive: true });

      const result = await controller.toggleActive('user-1', 'tenant-1', mockUser);

      expect(usersService.toggleActive).toHaveBeenCalledWith('user-1', 'tenant-1', mockUser);
      expect(result.message).toContain('تفعيل');
    });

    it('should return deactivation message when deactivated', async () => {
      usersService.toggleActive.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await controller.toggleActive('user-1', 'tenant-1', mockUser);

      expect(result.message).toContain('تعطيل');
    });
  });

  describe('remove', () => {
    it('should call usersService.remove', async () => {
      usersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('user-1', 'tenant-1', mockUser);

      expect(usersService.remove).toHaveBeenCalledWith('user-1', 'tenant-1', mockUser);
      expect(result.message).toBeDefined();
    });
  });

  describe('getMyPreferences', () => {
    it('should call usersService.getPreferences', async () => {
      usersService.getPreferences.mockResolvedValue({ theme: 'dark' });

      const result = await controller.getMyPreferences(mockUser);

      expect(usersService.getPreferences).toHaveBeenCalledWith('user-1');
      expect(result.data).toEqual({ theme: 'dark' });
    });
  });

  describe('updateMyPreferences', () => {
    it('should call usersService.updatePreferences', async () => {
      usersService.updatePreferences.mockResolvedValue({ theme: 'light', lang: 'ar' });

      const result = await controller.updateMyPreferences(
        mockUser,
        { preferences: { theme: 'light' } } as any,
      );

      expect(usersService.updatePreferences).toHaveBeenCalledWith('user-1', { theme: 'light' });
      expect(result.data).toEqual({ theme: 'light', lang: 'ar' });
      expect(result.message).toBeDefined();
    });

    it('should handle undefined preferences', async () => {
      usersService.updatePreferences.mockResolvedValue({});

      const result = await controller.updateMyPreferences(
        mockUser,
        { preferences: undefined } as any,
      );

      expect(usersService.updatePreferences).toHaveBeenCalledWith('user-1', {});
    });
  });
});
