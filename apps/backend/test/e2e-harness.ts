import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getOptionsToken } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@common/redis/redis.service';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { Tenant } from '../src/modules/tenants/tenant.entity';
import { UserRole } from '../src/modules/users/user.entity';
import { Beneficiary, CaseType } from '../src/modules/beneficiaries/beneficiary.entity';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const API_PREFIX = '/api/v1';
export const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL!;
export const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD!;

type StoredValue = { value: string; expiresAt?: number };

export class InMemoryRedisService {
  private store = new Map<string, StoredValue>();

  async resetThrottleCounters(): Promise<void> {
    this.store.clear();
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    for (const key of [...this.store.keys()]) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  async scan(pattern: string, cursor = '0'): Promise<[string, string[]]> {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    return [cursor === '0' ? '0' : '0', [...this.store.keys()].filter((key) => regex.test(key))];
  }

  isAvailable(): boolean {
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    this.store.clear();
  }

  clear(): void {
    this.store.clear();
  }
}

export interface E2eApp {
  app: INestApplication;
  moduleRef: TestingModule;
  baseUrl: string;
  tempDir: string;
  redis: InMemoryRedisService;
  dataSource: DataSource;
  close: () => Promise<void>;
}

export interface CreateE2eAppOptions {
  throttlers?: Array<{ name: string; ttl: number; limit: number }>;
}

export async function createE2eApp(opts: CreateE2eAppOptions = {}): Promise<E2eApp> {
  const originalCwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specialist-platform-e2e-'));
  const uploadDir = path.join(tempDir, 'uploads');
  fs.mkdirSync(path.join(tempDir, 'data'), { recursive: true });
  process.env.STORAGE_LOCAL_PATH = uploadDir;
  process.chdir(tempDir);

  const { AppModule } = await import('../src/app.module');
  const redis = new InMemoryRedisService();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(RedisService)
    .useValue(redis)
    .overrideProvider(getOptionsToken())
    .useValue(
      opts.throttlers ?? [
        { name: 'default', ttl: 300000, limit: 100000 },
        { name: 'strict', ttl: 60000, limit: 1000 },
        { name: 'relaxed', ttl: 60000, limit: 200 },
      ],
    )
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(0, '127.0.0.1');

  const server = app.getHttpServer();
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');

  const dataSource = app.get(DataSource);

  return {
    app,
    moduleRef,
    baseUrl: `http://127.0.0.1:${address.port}${API_PREFIX}`,
    tempDir,
    redis,
    dataSource,
    close: async () => {
      try {
        const server = app.getHttpServer();
        if (server && typeof server.closeIdleConnections === 'function') {
          server.closeIdleConnections();
        }
        if (server && typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
      } catch {
        // Ignore server-level teardown errors.
      }
      await Promise.race([
        app.close(),
        new Promise((resolve) => setTimeout(resolve, 30000)),
      ]);
      try {
        process.chdir(originalCwd);
      } catch {
        // CWD may already be gone if a previous suite timed out mid-teardown.
      }
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup only.
      }
    },
  };
}

export async function http(app: E2eApp, pathName: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const res = await fetch(`${app.baseUrl}${pathName}`, { ...init, headers });
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Binary or text response.
  }
  return { res, body, text };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function login(app: E2eApp, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const result = await http(app, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  expect(result.res.status).toBe(200);
  return result.body.data as { accessToken: string; refreshToken: string; user: any };
}

export async function seedTenant(app: E2eApp) {
  const tenantRepo = app.dataSource.getRepository(Tenant);
  return tenantRepo.save(
    tenantRepo.create({
      name: `E2E Center ${Date.now()}`,
      slug: `e2e-${Date.now()}`,
      maxUsers: 50,
      maxBeneficiaries: 50,
      isActive: true,
    }),
  );
}

export async function createUserViaApi(
  app: E2eApp,
  adminToken: string,
  input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId?: string;
  },
) {
  const result = await http(app, '/users', {
    method: 'POST',
    headers: bearer(adminToken),
    body: JSON.stringify(input),
  });
  expect(result.res.status).toBe(201);
  return result.body.data;
}

export async function createBeneficiaryViaApi(
  app: E2eApp,
  token: string,
  input: { firstName: string; lastName: string; assignedSpecialistId?: string },
) {
  const result = await http(app, '/beneficiaries', {
    method: 'POST',
    headers: bearer(token),
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      caseType: CaseType.PSYCHOLOGICAL,
      assignedSpecialistId: input.assignedSpecialistId,
    }),
  });
  expect(result.res.status).toBe(201);
  return result.body.data as Beneficiary;
}

export async function createSecurityFixture(app: E2eApp) {
  const admin = await login(app);
  const tenant = await seedTenant(app);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const password = 'E2eUserPass123!';

  const centerManager = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-manager-${suffix}@example.com`,
    password,
    firstName: 'Center',
    lastName: 'Manager',
    role: UserRole.CENTER_MANAGER,
    tenantId: tenant.id,
  });
  const specialistA = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-spec-a-${suffix}@example.com`,
    password,
    firstName: 'Specialist',
    lastName: 'A',
    role: UserRole.SPECIALIST,
    tenantId: tenant.id,
  });
  const specialistB = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-spec-b-${suffix}@example.com`,
    password,
    firstName: 'Specialist',
    lastName: 'B',
    role: UserRole.SPECIALIST,
    tenantId: tenant.id,
  });
  const receptionist = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-reception-${suffix}@example.com`,
    password,
    firstName: 'Reception',
    lastName: 'User',
    role: UserRole.RECEPTIONIST,
    tenantId: tenant.id,
  });
  const accountant = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-accountant-${suffix}@example.com`,
    password,
    firstName: 'Accountant',
    lastName: 'User',
    role: UserRole.ACCOUNTANT,
    tenantId: tenant.id,
  });
  const supervisor = await createUserViaApi(app, admin.accessToken, {
    email: `e2e-supervisor-${suffix}@example.com`,
    password,
    firstName: 'Supervisor',
    lastName: 'User',
    role: UserRole.SUPERVISOR,
    tenantId: tenant.id,
  });

  const specALogin = await login(app, specialistA.email, password);
  const specBLogin = await login(app, specialistB.email, password);
  const receptionistLogin = await login(app, receptionist.email, password);
  const accountantLogin = await login(app, accountant.email, password);
  const supervisorLogin = await login(app, supervisor.email, password);
  const managerLogin = await login(app, centerManager.email, password);

  const beneficiaryA = await createBeneficiaryViaApi(app, specALogin.accessToken, {
    firstName: 'Beneficiary',
    lastName: 'A',
    assignedSpecialistId: specialistA.id,
  });
  const beneficiaryB = await createBeneficiaryViaApi(app, specBLogin.accessToken, {
    firstName: 'Beneficiary',
    lastName: 'B',
    assignedSpecialistId: specialistB.id,
  });

  return {
    admin,
    tenant,
    password,
    users: { centerManager, specialistA, specialistB, receptionist, accountant, supervisor },
    tokens: { specALogin, specBLogin, receptionistLogin, accountantLogin, supervisorLogin, managerLogin },
    beneficiaries: { beneficiaryA, beneficiaryB },
  };
}

export async function createReportViaApi(
  app: E2eApp,
  token: string,
  input: { beneficiaryId: string; type: string; title: string },
) {
  const result = await http(app, '/reports', {
    method: 'POST',
    headers: bearer(token),
    body: JSON.stringify({
      beneficiaryId: input.beneficiaryId,
      type: input.type,
      title: input.title,
    }),
  });
  expect(result.res.status).toBe(201);
  return result.body.data;
}

export async function uploadFileViaApi(
  app: E2eApp,
  token: string,
  input: { entityType: string; entityId: string; file: Blob; fileName: string },
) {
  const form = new FormData();
  form.append('file', input.file, input.fileName);
  const result = await http(
    app,
    `/files/upload?entityType=${input.entityType}&entityId=${input.entityId}`,
    {
      method: 'POST',
      headers: bearer(token),
      body: form,
    },
  );
  return result;
}

export async function repo<T extends ObjectLiteral>(
  app: E2eApp,
  entity: new () => T,
): Promise<Repository<T>> {
  return app.dataSource.getRepository(entity);
}
