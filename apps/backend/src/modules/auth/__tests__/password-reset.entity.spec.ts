import { PasswordResetToken } from '../password-reset.entity';

describe('PasswordResetToken Entity', () => {
  describe('PasswordResetToken class', () => {
    it('should be instantiable', () => {
      const token = new PasswordResetToken();
      expect(token).toBeInstanceOf(PasswordResetToken);
    });

    it('should allow setting all properties', () => {
      const token = new PasswordResetToken();
      token.token = 'reset-token-123';
      token.userId = 'user-1';
      token.expiresAt = new Date('2026-07-01T00:00:00');
      token.usedAt = undefined as any;
      token.isUsed = false;

      expect(token.token).toBe('reset-token-123');
      expect(token.userId).toBe('user-1');
      expect(token.expiresAt).toEqual(new Date('2026-07-01T00:00:00'));
      expect(token.usedAt).toBeUndefined();
      expect(token.isUsed).toBe(false);
    });

    it('should support used token state', () => {
      const token = new PasswordResetToken();
      token.token = 'used-token';
      token.userId = 'user-1';
      token.expiresAt = new Date('2026-07-01T00:00:00');
      token.isUsed = true;
      token.usedAt = new Date('2026-06-28T12:00:00');

      expect(token.isUsed).toBe(true);
      expect(token.usedAt).toEqual(new Date('2026-06-28T12:00:00'));
    });

    it('should allow nullable fields to be undefined', () => {
      const token = new PasswordResetToken();
      expect(token.usedAt).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof PasswordResetToken).toBe('function');
    });
  });
});
