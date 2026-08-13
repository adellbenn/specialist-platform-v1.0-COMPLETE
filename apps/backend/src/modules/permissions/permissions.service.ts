import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { Permission, getAllModuleActions } from './permission.entity';
import { Role } from './role.entity';
import { PermissionGroup } from './permission-group.entity';
import { UserPermission, OverrideType } from './user-permission.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto,
  UserPermissionOverrideDto,
  BulkPermissionDto,
} from './dto/permission.dto';
import { AuditLogService } from '@modules/audit-log/audit-log.module';
import { AuditAction } from '@modules/audit-log/audit-log.entity';
import { RoleKey, ROLE_PERMISSIONS } from '@common/permissions/role-permissions';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permRepo: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(PermissionGroup)
    private groupRepo: Repository<PermissionGroup>,
    @InjectRepository(UserPermission)
    private userPermRepo: Repository<UserPermission>,
    private auditLog: AuditLogService,
  ) {}

  // ─── Seed ─────────────────────────────────────────────────────────
  async seedPermissions(): Promise<number> {
    const existing = await this.permRepo.count();
    if (existing > 0) return existing;

    const all = getAllModuleActions();
    const entities = all.map(({ module, action, key }) =>
      this.permRepo.create({
        module,
        action,
        displayName: key,
        isSystem: true,
      }),
    );
    await this.permRepo.save(entities);
    return entities.length;
  }

  // ─── Seed ─────────────────────────────────────────────────────────

  async seedRolesFromMap(createdById?: string): Promise<Role[]> {
    const allPermEntities = await this.permRepo.find();
    const keyToEntity = new Map<string, Permission>();
    for (const p of allPermEntities) {
      keyToEntity.set(`${p.module}:${p.action}`, p);
    }

    const roleKeys: RoleKey[] = [
      'super_admin',
      'center_manager',
      'supervisor',
      'specialist',
      'receptionist',
      'accountant',
      'beneficiary',
    ];

    const created: Role[] = [];
    for (const key of roleKeys) {
      const existing = await this.roleRepo.findOne({ where: { name: key } });
      if (existing) {
        created.push(existing);
        continue;
      }

      const enumPerms = ROLE_PERMISSIONS[key] || [];
      const permissions = enumPerms
        .map((p) => keyToEntity.get(p.toString()))
        .filter(Boolean) as Permission[];

      const role = this.roleRepo.create({
        name: key,
        isSystem: true,
        isActive: true,
        createdById,
        permissions,
      });
      created.push(await this.roleRepo.save(role));
    }
    return created;
  }

  // ─── Permissions ──────────────────────────────────────────────────
  async findAllPermissions() {
    return this.permRepo.find({ order: { module: 'ASC', sortOrder: 'ASC' } });
  }

  async findPermissionsByModule() {
    const perms = await this.permRepo.find({ order: { module: 'ASC', sortOrder: 'ASC' } });
    const grouped: Record<string, Permission[]> = {};
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }

  // ─── Roles ────────────────────────────────────────────────────────
  async findAllRoles() {
    return this.roleRepo.find({
      relations: ['permissions'],
      order: { priority: 'ASC', name: 'ASC' },
    });
  }

  async findRole(id: string) {
    const role = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new NotFoundException('الدور غير موجود');
    return role;
  }

  async createRole(dto: CreateRoleDto, userId: string) {
    const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('اسم الدور مستخدم مسبقاً');

    let permissions: Permission[] = [];
    if (dto.permissionIds?.length) {
      permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    } else if (dto.groupId) {
      const group = await this.groupRepo.findOne({
        where: { id: dto.groupId },
        relations: ['permissions'],
      });
      permissions = group?.permissions || [];
    }

    const role = this.roleRepo.create({
      name: dto.name,
      description: dto.description,
      color: dto.color || '#6B5B95',
      icon: dto.icon,
      priority: dto.priority ?? 0,
      createdById: userId,
      permissions,
    });
    const saved = await this.roleRepo.save(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.CREATE,
      entityType: 'Role',
      entityId: saved.id,
      newValues: { name: saved.name, permissions: permissions.length },
      description: `إنشاء دور ${saved.name}`,
    });
    return this.findRole(saved.id);
  }

  async updateRole(id: string, dto: UpdateRoleDto, userId: string) {
    const role = await this.findRole(id);
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('لا يمكن تعديل اسم دور نظامي');
    }

    const oldPerms = role.permissions.map((p) => p.id);
    Object.assign(role, dto);

    if (dto.permissionIds) {
      role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }

    const saved = await this.roleRepo.save(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Role',
      entityId: saved.id,
      oldValues: { name: role.name, permissions: oldPerms },
      newValues: { name: saved.name, permissions: saved.permissions.map((p) => p.id) },
      description: `تحديث دور ${saved.name}`,
    });
    return this.findRole(saved.id);
  }

  async duplicateRole(id: string, userId: string) {
    const original = await this.findRole(id);
    const newName = `${original.name} (نسخة)`;
    const role = this.roleRepo.create({
      name: newName,
      description: original.description,
      color: original.color,
      icon: original.icon,
      priority: original.priority,
      createdById: userId,
      permissions: original.permissions,
    });
    const saved = await this.roleRepo.save(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.CREATE,
      entityType: 'Role',
      entityId: saved.id,
      newValues: { name: saved.name, sourceRole: original.name },
      description: `نسخ دور من ${original.name}`,
    });
    return this.findRole(saved.id);
  }

  async archiveRole(id: string, userId: string) {
    const role = await this.findRole(id);
    if (role.isSystem) throw new BadRequestException('لا يمكن أرشفة دور نظامي');
    role.isActive = false;
    await this.roleRepo.save(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Role',
      entityId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      description: `أرشفة دور ${role.name}`,
    });
    return { message: 'تم أرشفة الدور' };
  }

  async deleteRole(id: string, userId: string) {
    const role = await this.findRole(id);
    if (role.isSystem) throw new BadRequestException('لا يمكن حذف دور نظامي');
    await this.roleRepo.remove(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.DELETE,
      entityType: 'Role',
      entityId: id,
      oldValues: { name: role.name },
      description: `حذف دور ${role.name}`,
    });
    return { message: 'تم حذف الدور' };
  }

  async bulkAssignPermissions(dto: BulkPermissionDto, userId: string) {
    const role = await this.findRole(dto.roleId);
    role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    await this.roleRepo.save(role);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Role',
      entityId: role.id,
      description: `تحديث صلاحيات دور ${role.name}`,
    });
    return this.findRole(role.id);
  }

  async compareRoles(ids: string[]) {
    if (ids.length < 2) throw new BadRequestException('قارن بين دورين على الأقل');
    const roles = await this.roleRepo.find({ where: { id: In(ids) }, relations: ['permissions'] });
    if (roles.length !== ids.length) throw new NotFoundException('بعض الأدوار غير موجودة');

    const allPerms = await this.permRepo.find();
    const permMap = new Map(allPerms.map((p) => [p.id, p]));

    return roles.map((role) => {
      const rolePermIds = new Set(role.permissions.map((p) => p.id));
      return {
        id: role.id,
        name: role.name,
        color: role.color,
        permissionCount: role.permissions.length,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          key: `${p.module}:${p.action}`,
          module: p.module,
          action: p.action,
          displayName: p.displayName,
        })),
        missingPermissions: allPerms
          .filter((p) => !rolePermIds.has(p.id))
          .map((p) => ({
            id: p.id,
            key: `${p.module}:${p.action}`,
            module: p.module,
            action: p.action,
          })),
      };
    });
  }

  async getRoleStats() {
    const total = await this.roleRepo.count();
    const active = await this.roleRepo.count({ where: { isActive: true } });
    const system = await this.roleRepo.count({ where: { isSystem: true } });
    const withPermissions = await this.roleRepo
      .createQueryBuilder('r')
      .innerJoin('role_permissions', 'rp', 'rp.role_id = r.id')
      .select('COUNT(DISTINCT r.id)', 'count')
      .getRawOne();
    return {
      total,
      active,
      archived: total - active,
      system,
      withPermissions: Number(withPermissions?.count ?? 0),
    };
  }

  // ─── Permission Groups ────────────────────────────────────────────
  async seedDefaultGroups(userId: string) {
    const existing = await this.groupRepo.count();
    if (existing > 0) throw new ConflictException('المجموعات موجودة مسبقاً');
    const allPerms = await this.permRepo.find();
    const byModule = (module: string) =>
      allPerms.filter((p) => p.module === module).map((p) => p.id);

    const templates = [
      {
        name: 'استقبال',
        color: '#2196F3',
        permissionIds: [...byModule('appointment'), ...byModule('beneficiary'), ...byModule('file')],
      },
      {
        name: 'أخصائي',
        color: '#4CAF50',
        permissionIds: [
          ...byModule('appointment'),
          ...byModule('beneficiary'),
          ...byModule('session'),
          ...byModule('medical_record'),
          ...byModule('file'),
        ],
      },
      {
        name: 'مدير',
        color: '#9C27B0',
        permissionIds: allPerms.filter((p) => !p.module.startsWith('system_')).map((p) => p.id),
      },
      {
        name: 'محاسب',
        color: '#FF9800',
        permissionIds: [...byModule('payment'), ...byModule('invoice'), ...byModule('report')],
      },
    ];

    const created = [];
    for (const t of templates) {
      const perms = await this.permRepo.findBy({ id: In(t.permissionIds) });
      const group = this.groupRepo.create({
        name: t.name,
        color: t.color,
        createdById: userId,
        permissions: perms,
      });
      created.push(await this.groupRepo.save(group));
    }
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.CREATE,
      entityType: 'PermissionGroup',
      entityId: 'bulk',
      newValues: { count: created.length },
      description: `إنشاء ${created.length} مجموعات صلاحيات افتراضية`,
    });
    return created;
  }

  async findAllGroups() {
    return this.groupRepo.find({ relations: ['permissions'], order: { name: 'ASC' } });
  }

  async findGroup(id: string) {
    const group = await this.groupRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!group) throw new NotFoundException('مجموعة الصلاحيات غير موجودة');
    return group;
  }

  async createGroup(dto: CreatePermissionGroupDto, userId: string) {
    const existing = await this.groupRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('اسم المجموعة مستخدم مسبقاً');

    let permissions: Permission[] = [];
    if (dto.permissionIds?.length) {
      permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }

    const group = this.groupRepo.create({
      name: dto.name,
      description: dto.description,
      color: dto.color,
      createdById: userId,
      permissions,
    });
    const saved = await this.groupRepo.save(group);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.CREATE,
      entityType: 'PermissionGroup',
      entityId: saved.id,
      newValues: { name: saved.name },
      description: `إنشاء مجموعة صلاحيات ${saved.name}`,
    });
    return this.findGroup(saved.id);
  }

  async updateGroup(id: string, dto: UpdatePermissionGroupDto, userId: string) {
    const group = await this.findGroup(id);
    Object.assign(group, dto);
    if (dto.permissionIds) {
      group.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }
    const saved = await this.groupRepo.save(group);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.UPDATE,
      entityType: 'PermissionGroup',
      entityId: id,
      description: `تحديث مجموعة صلاحيات ${saved.name}`,
    });
    return this.findGroup(saved.id);
  }

  async deleteGroup(id: string, userId: string) {
    const group = await this.findGroup(id);
    await this.groupRepo.remove(group);
    await this.auditLog.log({
      tenantId: undefined,
      userId,
      action: AuditAction.DELETE,
      entityType: 'PermissionGroup',
      entityId: id,
      oldValues: { name: group.name },
      description: `حذف مجموعة صلاحيات ${group.name}`,
    });
    return { message: 'تم حذف المجموعة' };
  }

  // ─── User Permission Overrides ────────────────────────────────────
  async getUserEffectivePermissions(userId: string) {
    const overrides = await this.userPermRepo.find({
      where: { userId },
      relations: ['permission'],
    });
    const granted: UserPermission[] = [];
    const denied: UserPermission[] = [];
    for (const o of overrides) {
      if (o.overrideType === OverrideType.GRANTED) granted.push(o);
      else denied.push(o);
    }
    return { granted, denied };
  }

  async setUserOverride(dto: UserPermissionOverrideDto, grantedById: string) {
    const existing = await this.userPermRepo.findOne({
      where: { userId: dto.userId, permissionId: dto.permissionId },
    });
    if (existing) {
      existing.overrideType = dto.overrideType as OverrideType;
      existing.grantedById = grantedById;
      if (dto.expiresAt) existing.expiresAt = new Date(dto.expiresAt);
      await this.userPermRepo.save(existing);
    } else {
      const override = this.userPermRepo.create({
        userId: dto.userId,
        permissionId: dto.permissionId,
        overrideType: dto.overrideType as OverrideType,
        grantedById,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      });
      await this.userPermRepo.save(override);
    }
    const perm = await this.permRepo.findOne({ where: { id: dto.permissionId } });
    await this.auditLog.log({
      tenantId: undefined,
      userId: grantedById,
      action: AuditAction.UPDATE,
      entityType: 'UserPermission',
      entityId: `${dto.userId}:${dto.permissionId}`,
      newValues: {
        userId: dto.userId,
        permissionId: dto.permissionId,
        overrideType: dto.overrideType,
      },
      description: `تجاوز صلاحية ${perm?.displayName || dto.permissionId} للمستخدم ${dto.userId}`,
    });
    return { message: 'تم تحديث التجاوز' };
  }

  async removeUserOverride(userId: string, permissionId: string, grantedById: string) {
    const existing = await this.userPermRepo.findOne({ where: { userId, permissionId } });
    if (!existing) throw new NotFoundException('التجاوز غير موجود');
    await this.userPermRepo.remove(existing);
    await this.auditLog.log({
      tenantId: undefined,
      userId: grantedById,
      action: AuditAction.DELETE,
      entityType: 'UserPermission',
      entityId: `${userId}:${permissionId}`,
      description: `إزالة تجاوز صلاحية للمستخدم ${userId}`,
    });
    return { message: 'تم إزالة التجاوز' };
  }
}
