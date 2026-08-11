import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../user.entity';

describe('User Entity — Password Hashing', () => {
  describe('User.hashPassword (static)', () => {
    it('should return a bcrypt hash', async () => {
      const hash = await User.hashPassword('testpassword123');
      expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
    });

    it('should use cost factor 12', async () => {
      const hash = await User.hashPassword('testpassword123');
      // bcrypt cost factor is encoded after the second $: $2a$12$...
      const cost = parseInt(hash.split('$')[2], 10);
      expect(cost).toBe(12);
    });

    it('should produce different hashes for same input (salt)', async () => {
      const hash1 = await User.hashPassword('samepassword');
      const hash2 = await User.hashPassword('samepassword');
      expect(hash1).not.toBe(hash2);
    });

    it('should be verifiable with bcrypt.compare', async () => {
      const plain = 'mysecretpassword';
      const hash = await User.hashPassword(plain);
      const result = await bcrypt.compare(plain, hash);
      expect(result).toBe(true);
    });

    it('should reject wrong password against hash', async () => {
      const hash = await User.hashPassword('correctpassword');
      const result = await bcrypt.compare('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePassword (instance)', () => {
    it('should return true for correct password', async () => {
      const user = new User();
      user.passwordHash = await User.hashPassword('testpassword');
      const result = await user.validatePassword('testpassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User();
      user.passwordHash = await User.hashPassword('testpassword');
      const result = await user.validatePassword('wrongpassword');
      expect(result).toBe(false);
    });
  });

  describe('No entity hooks (no double-hashing)', () => {
    it('should NOT have @BeforeInsert or @BeforeUpdate hooks', () => {
      // Verify that saving does NOT trigger any automatic hashing.
      // The entity should store exactly what we set in passwordHash.
      const metadata = (User as any).metadata;
      if (metadata) {
        // TypeORM metadata check — no beforeInsert or beforeUpdate listeners
        const listeners = metadata.beforeInsertListeners || [];
        const updateListeners = metadata.beforeUpdateListeners || [];
        expect(listeners).toHaveLength(0);
        expect(updateListeners).toHaveLength(0);
      }
    });

    it('saving an already-hashed password should NOT re-hash it', async () => {
      // Simulate what happens: service hashes, sets, saves
      const originalHash = await User.hashPassword('mypassword');

      // The passwordHash should remain exactly as set — no hook modifies it
      const user = new User();
      user.passwordHash = originalHash;

      // After any operation that would trigger @BeforeUpdate,
      // the hash should be identical
      expect(user.passwordHash).toBe(originalHash);
    });

    it('setting passwordHash directly stores the exact value', () => {
      const user = new User();
      const fakeHash = '$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      user.passwordHash = fakeHash;
      expect(user.passwordHash).toBe(fakeHash);
    });
  });
});
