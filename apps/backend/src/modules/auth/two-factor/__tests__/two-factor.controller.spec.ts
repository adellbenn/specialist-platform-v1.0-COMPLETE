import { TwoFactorController } from '../two-factor.controller';

describe('TwoFactorController', () => {
  let controller: TwoFactorController;
  let twoFactorService: any;

  beforeEach(() => {
    twoFactorService = {
      generateSecret: jest.fn(),
      verifyAndEnable: jest.fn(),
      disable: jest.fn(),
      getStatus: jest.fn(),
    };
    controller = new TwoFactorController(twoFactorService);
  });

  const mockUser = { id: 'user-1', email: 'test@test.com' } as any;

  describe('generate', () => {
    it('should call twoFactorService.generateSecret and return result', async () => {
      const result = { secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: 'otpauth://...', backupCodes: ['1234', '5678'] };
      twoFactorService.generateSecret.mockResolvedValue(result);

      const response = await controller.generate(mockUser);

      expect(twoFactorService.generateSecret).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({
        data: result,
        message: 'Scan the QR code with your authenticator app',
      });
    });
  });

  describe('verifyAndEnable', () => {
    it('should call twoFactorService.verifyAndEnable', async () => {
      twoFactorService.verifyAndEnable.mockResolvedValue(undefined);

      const response = await controller.verifyAndEnable(mockUser, { code: '123456' } as any);

      expect(twoFactorService.verifyAndEnable).toHaveBeenCalledWith('user-1', '123456');
      expect(response).toEqual({ message: '2FA enabled successfully' });
    });
  });

  describe('disable', () => {
    it('should call twoFactorService.disable with password and code', async () => {
      twoFactorService.disable.mockResolvedValue(undefined);

      const response = await controller.disable(mockUser, {
        password: 'pass123',
        code: '123456',
      } as any);

      expect(twoFactorService.disable).toHaveBeenCalledWith('user-1', 'pass123', '123456');
      expect(response).toEqual({ message: '2FA disabled successfully' });
    });
  });

  describe('status', () => {
    it('should call twoFactorService.getStatus and return result', async () => {
      const result = { enabled: true, backupCodesRemaining: 8 };
      twoFactorService.getStatus.mockResolvedValue(result);

      const response = await controller.status(mockUser);

      expect(twoFactorService.getStatus).toHaveBeenCalledWith('user-1');
      expect(response).toBe(result);
    });
  });
});
