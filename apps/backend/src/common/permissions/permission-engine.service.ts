import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@modules/permissions/role.entity';
import { Permission as PermissionEntity } from '@modules/permissions/permission.entity';
import { UserPermission, OverrideType } from '@modules/permissions/user-permission.entity';
import { UserRole } from '@modules/users/user.entity';
import { Permission } from '@common/permissions/permissions.enum';
import { getPermissionsForRole, RoleKey } from '@common/permissions/role-permissions';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class PermissionEngine {
  private static readonly CACHE_PREFIX = 'perms:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(PermissionEntity)
    private permRepo: Repository<PermissionEntity>,
    @InjectRepository(UserPermission)
    private userPermRepo: Repository<UserPermission>,
    private redisService: RedisService,
  ) {}

  async authorize(
    user: { id: string; role: UserRole; roleId?: string },
    requiredPermission: string,
  ): Promise<boolean> {
    const result = await this.authorizeAll(user, [requiredPermission]);
    return result.allowed;
  }

  async authorizeAll(
    user: { id: string; role: UserRole; roleId?: string },
    requiredPermissions: string[],
  ): Promise<{ allowed: boolean; missing: string[] }> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return { allowed: true, missing: [] };
    }

    const effective = user.roleId
      ? await this.getEffectivePermissions(user.id, user.roleId)
      : this.getStaticFallback(user.role);

    const missing = requiredPermissions.filter((p) => !effective.has(p));
    return { allowed: missing.length === 0, missing };
  }

  async getEffectivePermissions(
    userId: string,
    roleId: string,
    role?: UserRole,
  ): Promise<Set<string>> {
    // Try cache first
    const cacheKey = `${PermissionEngine.CACHE_PREFIX}${userId}`;
    const cached = await this.redisService.getJson<string[]>(cacheKey);
    if (cached) {
      return new Set(cached);
    }

    // Cache miss — query DB
    if (role === UserRole.SUPER_ADMIN) {
      const all = await this.permRepo.find({ select: ['module', 'action'] });
      return new Set(all.map((p) => `${p.module}:${p.action}`));
    }

    const roleEntity = await this.roleRepo.findOne({
      where: { id: roleId, isActive: true },
      relations: ['permissions'],
    });
    const effective = new Set<string>();

    if (roleEntity) {
      for (const p of roleEntity.permissions) {
        effective.add(`${p.module}:${p.action}`);
      }
    }

    const overrides = await this.userPermRepo.find({
      where: { userId },
      relations: ['permission'],
    });
    for (const ov of overrides) {
      const key = `${ov.permission.module}:${ov.permission.action}`;
      if (ov.overrideType === OverrideType.DENIED) {
        effective.delete(key);
      } else {
        effective.add(key);
      }
    }

    // Cache the result
    await this.redisService.setJson(cacheKey, [...effective], PermissionEngine.CACHE_TTL);

    return effective;
  }

  async getEffectivePermissionsList(
    userId: string,
    roleId: string,
    role?: UserRole,
  ): Promise<string[]> {
    const perms = await this.getEffectivePermissions(userId, roleId, role);
    return [...perms];
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.redisService.del(`${PermissionEngine.CACHE_PREFIX}${userId}`);
  }

  private getStaticFallback(userRole: UserRole): Set<string> {
    const perms = getPermissionsForRole(userRole as RoleKey);
    return new Set(perms.map((p: Permission) => p.toString()));
  }
}
