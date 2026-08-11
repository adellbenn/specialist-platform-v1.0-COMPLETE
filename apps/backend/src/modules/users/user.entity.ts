import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { AbstractEntity } from '@database/abstract.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { Role } from '@modules/permissions/role.entity';

// ─── Enums ────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CENTER_MANAGER = 'center_manager',
  SUPERVISOR = 'supervisor',
  SPECIALIST = 'specialist',
  RECEPTIONIST = 'receptionist',
  ACCOUNTANT = 'accountant',
  BENEFICIARY = 'beneficiary', // ← جديد
}

// ─── RBAC Classification ──────────────────────────────────────

/** أدوار الإدارة — قراءة فقط بدون تعديل بيانات المتابعة */
export const ADMIN_CLASS_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.CENTER_MANAGER,
  UserRole.SUPERVISOR,
];

/** أدوار الكتابة — صلاحيات إدخال وتعديل */
export const WRITER_CLASS_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.CENTER_MANAGER,
  UserRole.SPECIALIST,
  UserRole.RECEPTIONIST,
];

/** أدوار الكتابة الكاملة — تتجاوز منع التعديل في RbacGuard */
export const WRITE_BYPASS_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.CENTER_MANAGER,
  UserRole.SUPERVISOR,
  UserRole.ACCOUNTANT,
];

/** دور المستفيد — مستقل تماماً */
export const BENEFICIARY_ROLES: UserRole[] = [UserRole.BENEFICIARY];

export enum RbacClass {
  ADMIN = 'admin',
  WRITER = 'writer',
  BENEFICIARY = 'beneficiary',
}

export function getRbacClass(role: UserRole): RbacClass {
  if (ADMIN_CLASS_ROLES.includes(role)) return RbacClass.ADMIN;
  if (WRITER_CLASS_ROLES.includes(role)) return RbacClass.WRITER;
  return RbacClass.BENEFICIARY;
}

// ─── Entity ───────────────────────────────────────────────────

@Entity('users')
@Index(['tenantId', 'role'])
export class User extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'varchar', enum: UserRole })
  @Index()
  role: UserRole;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  assignedRole: Role;

  /**
   * للمستفيدين فقط — معرّف سجل المستفيد في جدول beneficiaries
   * يسمح بربط حساب المستفيد بملفه
   */
  @Column({ name: 'beneficiary_id', nullable: true })
  beneficiaryId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'theme_preference', default: 'system' })
  themePreference: string;

  @Column({ name: 'preferences', type: 'simple-json', nullable: true })
  preferences: Record<string, any>;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  @Column({ name: 'two_factor_secret', nullable: true })
  @Exclude()
  twoFactorSecret: string;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_backup_codes', nullable: true })
  @Exclude()
  twoFactorBackupCodes: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Hash a plaintext password using bcrypt (cost factor 12).
   * Services MUST call this before setting `passwordHash`.
   * No entity hooks — hashing is explicit and deterministic.
   */
  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
