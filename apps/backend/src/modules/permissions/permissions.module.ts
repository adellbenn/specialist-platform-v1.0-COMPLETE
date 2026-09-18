import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { PermissionGroup } from './permission-group.entity';
import { UserPermission } from './user-permission.entity';
import { User } from '@modules/users/user.entity';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { PermissionEngine } from '@common/permissions/permission-engine.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role, PermissionGroup, UserPermission, User]),
    AuditLogModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionEngine],
  exports: [PermissionsService, PermissionEngine, TypeOrmModule],
})
export class PermissionsModule {}
