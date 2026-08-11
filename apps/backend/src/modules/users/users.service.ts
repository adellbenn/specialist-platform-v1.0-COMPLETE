import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { Role } from '@modules/permissions/role.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private permissionsService: PermissionsService,
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
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'noray.ugc@gmail.com';

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

    // Super Admin فقط يمكنه إنشاء Super Admin آخر
    if (dto.role === UserRole.SUPER_ADMIN && creatorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('لا يمكنك إنشاء مدير عام');
    }

    // تعيين tenant تلقائياً إذا لم يكن المنشئ super_admin
    const tenantId = creatorRole === UserRole.SUPER_ADMIN ? dto.tenantId : creatorTenantId;

    // تعيين roleId تلقائياً حسب الدور
    let roleId = dto.roleId;
    if (!roleId) {
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

  async update(id: string, dto: UpdateUserDto, tenantId?: string): Promise<User> {
    const user = await this.findOne(id, tenantId);

    if (dto.password) {
      user.passwordHash = await User.hashPassword(dto.password);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
    }

    if (dto.role && dto.role !== user.role) {
      user.role = dto.role;
      const role = await this.roleRepository.findOne({ where: { name: dto.role } });
      if (role) user.roleId = role.id;
    }

    Object.assign(user, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.roleId && { roleId: dto.roleId }),
    });

    return this.userRepository.save(user);
  }

  async toggleActive(id: string, tenantId?: string): Promise<User> {
    const user = await this.findOne(id, tenantId);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const user = await this.findOne(id, tenantId);
    // Soft delete — تعطيل بدلاً من الحذف
    user.isActive = false;
    await this.userRepository.save(user);
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
}
