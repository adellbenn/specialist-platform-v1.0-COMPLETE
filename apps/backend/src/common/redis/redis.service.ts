import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisMetricsService } from '@common/metrics/redis-metrics.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(
    private configService: ConfigService,
    @Optional() private readonly metrics?: RedisMetricsService,
  ) {
    this.connect();
  }

  private connect() {
    try {
      this.client = new Redis({
        host: this.configService.get<string>('redis.host', '127.0.0.1'),
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password') || undefined,
        keyPrefix: this.configService.get<string>('redis.keyPrefix', 'sp:'),
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.connect().catch(() => {
        this.logger.warn('Redis unavailable — operating without cache');
      });
    } catch (err) {
      this.logger.warn('Redis init failed — operating without cache');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    const start = Date.now();
    try {
      const result = await this.client.get(key);
      this.metrics?.recordOperation('get', Date.now() - start, true);
      if (result) {
        this.metrics?.recordHit('get', Date.now() - start);
      } else {
        this.metrics?.recordMiss('get', Date.now() - start);
      }
      return result;
    } catch {
      this.metrics?.recordOperation('get', Date.now() - start, false);
      return null;
    }
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
    if (!this.client || !this.isConnected) return;
    const start = Date.now();
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      this.metrics?.recordOperation('set', Date.now() - start, true);
    } catch {
      this.metrics?.recordOperation('set', Date.now() - start, false);
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    const start = Date.now();
    try {
      await this.client.del(key);
      this.metrics?.recordOperation('del', Date.now() - start, true);
    } catch {
      this.metrics?.recordOperation('del', Date.now() - start, false);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    const start = Date.now();
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
      this.metrics?.recordOperation('delPattern', Date.now() - start, true);
    } catch {
      this.metrics?.recordOperation('delPattern', Date.now() - start, false);
    }
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  async scan(pattern: string, cursor: string = '0'): Promise<[string, string[]]> {
    if (!this.client || !this.isConnected) return ['0', []];
    try {
      return await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    } catch {
      return ['0', []];
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
