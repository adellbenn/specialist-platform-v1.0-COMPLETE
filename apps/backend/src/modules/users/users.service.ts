import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { Role } from '@modules/permissions/role.entity';
import { PermissionEngine } from '@common/permissions/permission-engine.service';
import { AuthService } from '@modules/auth/auth.service';
import * as crypto from 'crypto';

/** ترتيب الأدوار للتحكم في سلسلة الصلاحيات (الأعلى يقدر يدير الأقل أو المساوي) */
const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.CENTER_MANAGER]: 4,
  [UserRole.SUPERVISOR]: 3,
  [UserRole.ACCOUNTANT]: 3,
  [UserRole.SPECIALIST]: 2,
  [UserRole.RECEPTIONIST]: 2,
  [UserRole.BENEFICIARY]: 1,
};

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private permissionsService: PermissionsService,
    private engine: PermissionEngine,
    private authService: AuthService,
  ) {}

  async onModuleInit() {
    const count = await this.userRepository.count();
    if (count > 0) return;

    // 1. Seed permissions
    await this.permissionsService.seedPermissions();

    // 2. Seed roles from static map
    const roles = await this.permissionsService.seedRolesFromMap(undefined);
    const roleMap = new Map(roles.map((r) => [r.name, r]));

    // 3. Create super admin with the super_admin role
    const superAdminRole = roleMap.get('super_admin');
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'adel.ben14789@gmail.com';

    let adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    let forcePasswordChange = false;

    if (!adminPassword) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'SUPER_ADMIN_PASSWORD must be set in production. ' +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(24).toString('base64'))\"",
        );
      }
      // Dev mode: generate random password, force change on first login
      adminPassword = crypto.randomBytes(18).toString('base64');
      forcePasswordChange = true;
      this.logger.warn(`[DEV] Super admin generated password: ${adminPassword}`);
      this.logger.warn('[DEV] User MUST change password on first login.');
    }

    await this.userRepository.save(
      this.userRepository.create({
        email: adminEmail,
        passwordHash: await User.hashPassword(adminPassword),
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        roleId: superAdminRole?.id,
        isActive: true,
        mustChangePassword: forcePasswordChange,
      }),
    );

    if (forcePasswordChange) {
      this.logger.warn(`✓ Super Admin created: ${adminEmail} (MUST change password)`);
    } else {
      this.logger.log(`✓ Super Admin created: ${adminEmail}`);
    }
  }

  async create(dto: CreateUserDto, creatorRole: UserRole, creatorTenantId: string): Promise<User> {
    // التحقق من عدم تكرار البريد الإلكتروني
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');

    // لا يمكن لأحد إنشاء دور أعلى من دوره
    this.assertCanAssignRole(creatorRole, dto.role);

    // تعيين tenant تلقائياً إذا لم يكن المنشئ super_admin
    const tenantId = creatorRole === UserRole.SUPER_ADMIN ? dto.tenantId : creatorTenantId;

    // تعيين roleId تلقائياً حسب الدور
    let roleId = dto.roleId;
    if (roleId) {
      // منع ربط دور لا يطابق الدور المختار
      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role || role.name !== dto.role) {
        throw new BadRequestException('الدور المحدد لا يطابق الصلاحية المطلوبة');
      }
    } else {
      const role = await this.roleRepository.findOne({ where: { name: dto.role } });
      if (role) roleId = role.id;
    }

    const user = this.userRepository.create({
      ...dto,
      passwordHash: await User.hashPassword(dto.password),
      tenantId,
      roleId,
    });

    return this.userRepository.save(user);
  }

  async findAll(query: UserQueryDto, tenantId?: string) {
    const { search, role, isActive, page = 1, limit = 20 } = query;

    const where: any = {};

    // فلترة حسب المركز
    if (tenantId) where.tenantId = tenantId;
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const options: FindManyOptions<User> = {
      where: search
        ? [
            { ...where, firstName: Like(`%${search}%`) },
            { ...where, lastName: Like(`%${search}%`) },
            { ...where, email: Like(`%${search}%`) },
          ]
        : where,
      relations: ['tenant', 'assignedRole'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    const [data, total] = await this.userRepository.findAndCount(options);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId?: string): Promise<User> {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const user = await this.userRepository.findOne({
      where,
      relations: ['tenant', 'assignedRole', 'assignedRole.permissions'],
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    tenantId?: string,
    requestingUser?: User,
  ): Promise<User> {
    const user = await this.findOne(id, tenantId);
    if (requestingUser) this.assertCanManageUser(requestingUser, user);
    this.assertNotPrimaryTarget(user, 'تعديل الحساب الرئيسي غير مسموح');

    const newRole = dto.role;
    const roleChanged = newRole != null && newRole !== user.role;
    const passwordChanged = !!dto.password;

    if (dto.password) {
      user.passwordHash = await User.hashPassword(dto.password);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
    }

    if (roleChanged) {
      // لا يمكن رفع/خفض دور أعلى من دور المستدعي
      if (requestingUser && newRole) this.assertCanAssignRole(requestingUser.role, newRole);
      if (newRole) {
        user.role = newRole;
        const role = await this.roleRepository.findOne({ where: { name: newRole } });
        if (role) user.roleId = role.id;
      }
    }

    Object.assign(user, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone && { phone: dto.phone }),
    });

    const saved = await this.userRepository.save(user);

    // Role change invalidates cached role-based decisions
    if (roleChanged) {
      await this.engine.invalidateUserPermissions(id);
    }

    // Password change by an administrator must terminate existing sessions
    if (passwordChanged) {
      await this.authService.revokeAllUserAccess(id);
    } else if (roleChanged) {
      await this.authService.invalidateUserCache(id);
    }

    return saved;
  }

  async toggleActive(id: string, tenantId?: string, requestingUser?: User): Promise<User> {
    const user = await this.findOne(id, tenantId);
    if (requestingUser) this.assertCanManageUser(requestingUser, user);
    const wasActive = user.isActive;
    user.isActive = !user.isActive;
    const saved = await this.userRepository.save(user);

    // Deactivation must immediately terminate every session and
    // invalidate cached state; reactivation only clears stale cache entries.
    await this.engine.invalidateUserPermissions(id);
    if (wasActive && !user.isActive) {
      await this.authService.revokeAllUserAccess(id);
    } else {
      await this.authService.invalidateUserCache(id);
    }

    return saved;
  }

  async remove(id: string, tenantId?: string, requestingUser?: User): Promise<void> {
    const user = await this.findOne(id, tenantId);
    if (requestingUser) this.assertCanManageUser(requestingUser, user);
    // Soft delete — تعطيل بدلاً من الحذف
    user.isActive = false;
    await this.userRepository.save(user);
    await this.authService.revokeAllUserAccess(id);
    await this.engine.invalidateUserPermissions(id);
  }

  // ─── Preferences ─────────────────────────────────────────────

  async getPreferences(userId: string): Promise<Record<string, any>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user.preferences || {};
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, any>,
  ): Promise<Record<string, any>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    user.preferences = { ...(user.preferences || {}), ...preferences };
    await this.userRepository.save(user);
    return user.preferences;
  }

  // ─── ROLE HIERARCHY HELPERS ─────────────────────────────────

  /**
   * هل يمكن للمستدعي تعيين الدور المطلوب؟
   * يمنع رفع الأدوار خارج سلطة المستدعي (Super Admin فقط يدير Super Admin)
   */
  private assertCanAssignRole(callerRole: UserRole, targetRole: UserRole): void {
    if (targetRole === UserRole.SUPER_ADMIN && callerRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('لا يمكنك منح صلاحية المدير العام');
    }
    if (ROLE_RANK[targetRole] > ROLE_RANK[callerRole]) {
      throw new ForbiddenException('لا يمكنك إدارة مستخدمين بدور أعلى من دورك');
    }
  }

  /**
   * هل يمكن للمستدعي إدارة المستخدم الهدف؟
   */
  private assertCanManageUser(caller: User, target: User): void {
    if (target.role === UserRole.SUPER_ADMIN && caller.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('لا يمكنك إدارة المدير العام');
    }
    if (ROLE_RANK[target.role] > ROLE_RANK[caller.role]) {
      throw new ForbiddenException('لا يمكنك إدارة مستخدمين بدور أعلى من دورك');
    }
  }

  /**
   * الحساب الرئيسي (Primary Super Admin) حماية مُطلقة في طبقة الخدمة.
   * يُعرَّف من SINGLE_ADMIN_EMAIL/SUPER_ADMIN_EMAIL المعتمد في الـbootstrap —
   * لا يعتمد على Frontend ولا على أدوار المستدعي.
   */
  private readonly primarySuperAdminEmail =
    process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || 'adel.ben14789@gmail.com';

  private isPrimarySuperAdmin(target: User): boolean {
    return target.email.toLowerCase() === this.primarySuperAdminEmail;
  }

  private assertNotPrimaryTarget(target: User, message = 'PRIMARY_SUPER_ADMIN_PROTECTED'): void {
    if (this.isPrimarySuperAdmin(target)) {
      throw new ForbiddenException(message);
    }
  }
}
