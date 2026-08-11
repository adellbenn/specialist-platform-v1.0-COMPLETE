import { AuthController } from '../auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      completeTwoFactorLogin: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      refreshToken: jest.fn(),
      getProfile: jest.fn(),
      getActiveSessions: jest.fn(),
      revokeSession: jest.fn(),
      updateTheme: jest.fn(),
      updateProfile: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      changePassword: jest.fn(),
    };
    controller = new AuthController(authService);
  });

  const mockReq = (overrides: any = {}) => ({
    headers: {
      'user-agent': 'Mozilla/5.0',
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      ...overrides.headers,
    },
    ip: '127.0.0.1',
    body: overrides.body || {},
    ...overrides,
  }) as any;

  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'specialist' } as any;

  describe('login', () => {
    it('should call authService.login with correct params', async () => {
      const dto = { email: 'test@test.com', password: 'pass123' };
      const result = { accessToken: 'token', refreshToken: 'refresh' };
      authService.login.mockResolvedValue(result);

      const response = await controller.login(dto as any, mockReq());

      expect(authService.login).toHaveBeenCalledWith(dto, 'Mozilla/5.0', '192.168.1.1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل الدخول بنجاح' });
    });
  });

  describe('loginTwoFactor', () => {
    it('should call authService.completeTwoFactorLogin', async () => {
      const dto = { tempToken: 'temp', code: '123456' };
      const result = { accessToken: 'token' };
      authService.completeTwoFactorLogin.mockResolvedValue(result);

      const response = await controller.loginTwoFactor(dto as any, mockReq());

      expect(authService.completeTwoFactorLogin).toHaveBeenCalledWith('temp', '123456', 'Mozilla/5.0', '192.168.1.1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل الدخول بنجاح' });
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto = { email: 'test@test.com' };
      const result = { message: 'Email sent' };
      authService.forgotPassword.mockResolvedValue(result);

      const response = await controller.forgotPassword(dto as any);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(response).toBe(result);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const dto = { token: 'reset-token', password: 'newpass123' };
      const result = { message: 'Password reset' };
      authService.resetPassword.mockResolvedValue(result);

      const response = await controller.resetPassword(dto as any);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(response).toBe(result);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with correct params', async () => {
      const dto = { refreshToken: 'refresh-token' };
      const result = { accessToken: 'new-token' };
      authService.refreshToken.mockResolvedValue(result);

      const response = await controller.refreshToken(dto as any, mockReq());

      expect(authService.refreshToken).toHaveBeenCalledWith(dto, 'Mozilla/5.0', '192.168.1.1');
      expect(response).toEqual({ data: result, message: 'تم تجديد الرمز بنجاح' });
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id', async () => {
      const profile = { id: 'user-1', email: 'test@test.com' };
      authService.getProfile.mockResolvedValue(profile);

      const response = await controller.getProfile(mockUser);

      expect(authService.getProfile).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ data: profile });
    });
  });

  describe('getSessions', () => {
    it('should call authService.getActiveSessions with user id', async () => {
      const sessions = [{ id: 'session-1' }];
      authService.getActiveSessions.mockResolvedValue(sessions);

      const response = await controller.getSessions(mockUser);

      expect(authService.getActiveSessions).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ data: sessions });
    });
  });

  describe('revokeSession', () => {
    it('should call authService.revokeSession', async () => {
      authService.revokeSession.mockResolvedValue(undefined);

      const response = await controller.revokeSession(mockUser, 'device-1');

      expect(authService.revokeSession).toHaveBeenCalledWith('user-1', 'device-1');
      expect(response).toEqual({ message: 'تم حذف الجلسة بنجاح' });
    });
  });

  describe('updateTheme', () => {
    it('should call authService.updateTheme', async () => {
      authService.updateTheme.mockResolvedValue(undefined);

      const response = await controller.updateTheme({ theme: 'dark' } as any, mockUser);

      expect(authService.updateTheme).toHaveBeenCalledWith('user-1', 'dark');
      expect(response).toEqual({ message: 'تم تحديث السمة' });
    });
  });

  describe('updateProfile', () => {
    it('should call authService.updateProfile', async () => {
      const dto = { firstName: 'New' };
      const updated = { id: 'user-1', firstName: 'New' };
      authService.updateProfile.mockResolvedValue(updated);

      const response = await controller.updateProfile(dto as any, mockUser);

      expect(authService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(response).toEqual({ data: updated, message: 'تم تحديث الملف الشخصي' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = mockReq({ body: { refreshToken: 'refresh-token' } });

      const response = await controller.logout(mockUser, req);

      expect(authService.logout).toHaveBeenCalledWith('user-1', 'refresh-token', 'Mozilla/5.0', '192.168.1.1');
      expect(response).toEqual({ message: 'تم تسجيل الخروج بنجاح' });
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll', async () => {
      authService.logoutAll.mockResolvedValue(undefined);

      const response = await controller.logoutAll(mockUser);

      expect(authService.logoutAll).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح' });
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword', async () => {
      const dto = { currentPassword: 'old', newPassword: 'new123' };
      authService.changePassword.mockResolvedValue(undefined);

      const response = await controller.changePassword(dto as any, mockUser);

      expect(authService.changePassword).toHaveBeenCalledWith('user-1', dto);
      expect(response).toEqual({ message: 'تم تغيير كلمة المرور بنجاح' });
    });
  });

  describe('extractDeviceInfo', () => {
    it('should extract userAgent and ip from headers', async () => {
      authService.login.mockResolvedValue({});
      const req = mockReq({
        headers: { 'user-agent': 'TestAgent', 'x-forwarded-for': '1.1.1.1' },
      });
      await controller.login({} as any, req);
      expect(authService.login).toHaveBeenCalledWith({}, 'TestAgent', '1.1.1.1');
    });

    it('should fallback to "unknown" when headers are missing', async () => {
      authService.login.mockResolvedValue({});
      const req = mockReq({
        headers: {},
        ip: undefined,
      });
      await controller.login({} as any, req);
      expect(authService.login).toHaveBeenCalledWith({}, 'unknown', 'unknown');
    });
  });
});
