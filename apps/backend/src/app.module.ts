import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { WinstonModule } from 'nest-winston';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { createWinstonOptions } from '@common/logging/winston.config';

import { appConfig, dbConfig, jwtConfig, storageConfig, redisConfig } from '@config/configuration';
import { validationSchema, formatValidationError } from '@config/validation';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { BeneficiariesModule } from '@modules/beneficiaries/beneficiaries.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { FilesModule } from '@modules/files/files.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { SearchModule } from '@modules/search/search.module';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { HealthModule } from '@modules/health/health.module';
import { RedisModule } from '@common/redis/redis.module';
import { MetricsModule } from '@common/metrics/metrics.module';
import { HttpMetricsInterceptor } from '@common/metrics/http-metrics.interceptor';
import { DatabaseMetricsService } from '@common/metrics/database-metrics.service';
import { AppMetricsService } from '@common/metrics/app-metrics.service';
import { VirusScannerService } from '@common/security/virus-scanner.service';

import { User } from '@modules/users/user.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { BeneficiaryFile } from '@modules/beneficiaries/beneficiary-file.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { Report } from '@modules/reports/report.entity';
import { FileAttachment } from '@modules/files/file-attachment.entity';
import { ServicePackage } from '@modules/payments/service-package.entity';
import { Subscription } from '@modules/payments/subscription.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { Notification } from '@modules/notifications/notification.entity';
import { AuditLog } from '@modules/audit-log/audit-log.entity';
import { Permission } from '@modules/permissions/permission.entity';
import { Role } from '@modules/permissions/role.entity';
import { PermissionGroup } from '@modules/permissions/permission-group.entity';
import { UserPermission } from '@modules/permissions/user-permission.entity';

import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { CorrelationIdInterceptor } from '@common/interceptors/correlation-id.interceptor';
// import { RbacMiddleware } from '@common/middleware/rbac.middleware';

@Module({
  imports: [
    WinstonModule.forRoot(createWinstonOptions()),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig, storageConfig, redisConfig],
      validationSchema,
      validationOptions: {
        abortEarly: true,
        noUnknown: true,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const entities = [
          User,
          Tenant,
          Beneficiary,
          BeneficiaryFile,
          Appointment,
          Session,
          Report,
          FileAttachment,
          ServicePackage,
          Subscription,
          Invoice,
          Notification,
          AuditLog,
          Permission,
          Role,
          PermissionGroup,
          UserPermission,
        ];
        const isProd = config.get('app.nodeEnv') === 'production';
        const sync = config.get('database.sync', false);

        if (isProd && sync) {
          throw new Error(
            'FATAL: DB_SYNC=true is not allowed in production. ' +
              'Use "npm run migration:run" instead. ' +
              'Set DB_SYNC=false in your .env file.',
          );
        }

        const logging = config.get('database.logging', false);
        if (config.get('DB_TYPE', 'sqlite') === 'postgres') {
          return {
            type: 'postgres',
            host: config.get('database.host'),
            port: config.get('database.port'),
            username: config.get('database.username'),
            password: config.get('database.password'),
            database: config.get('database.name'),
            entities,
            synchronize: sync,
            logging,
            poolSize: config.get('database.poolSize', 10),
            extra: {
              idleTimeoutMillis: config.get('database.idleTimeoutMs', 30000),
              connectionTimeoutMillis: config.get('database.connectTimeoutMs', 5000),
            },
            ssl: isProd && config.get('database.ssl', true)
              ? { rejectUnauthorized: config.get('database.sslRejectUnauthorized', true) }
              : false,
          } as any;
        }
        return {
          type: 'sqlite',
          database: './data/specialist_platform.sqlite',
          entities,
          synchronize: sync,
          logging,
        } as any;
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 60),
        },
        {
          name: 'strict',
          ttl: 60 * 1000,
          limit: 5,
        },
        {
          name: 'relaxed',
          ttl: 60 * 1000,
          limit: 200,
        },
      ],
    }),

    // JwtModule عالمي — يستخدمه RbacMiddleware
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),

    AuthModule,
    UsersModule,
    TenantsModule,
    BeneficiariesModule,
    AppointmentsModule,
    SessionsModule,
    ReportsModule,
    FilesModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    SearchModule,
    AuditLogModule,
    PermissionsModule,
    HealthModule,
    MetricsModule,
    RedisModule,
    TypeOrmModule.forFeature([Beneficiary, Appointment, Session, Invoice]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    DatabaseMetricsService,
    AppMetricsService,
    VirusScannerService,
  ],
})
export class AppModule implements NestModule {
  /**
   * تطبيق RbacMiddleware على جميع مسارات /api/*
   * يعمل قبل وصول الطلب للـ Guards والـ Controllers
   */
  configure(consumer: MiddlewareConsumer) {
    // RbacMiddleware removed — RbacGuard handles per-controller
  }
}
