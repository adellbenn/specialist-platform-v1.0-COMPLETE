import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@common/redis/redis.service';
import * as crypto from 'crypto';

export interface DeviceSession {
  deviceId: string;
  userAgent: string;
  ip: string;
  lastActive: string;
  createdAt: string;
  refreshTokenJti: string;
}

@Injectable()
export class DeviceSessionsService {
  private readonly logger = new Logger(DeviceSessionsService.name);
  private static readonly PREFIX = 'session:';
  private static readonly TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(private redisService: RedisService) {}

  generateDeviceId(userAgent: string, ip: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userAgent}:${ip}`)
      .digest('hex')
      .slice(0, 16);
  }

  async createSession(
    userId: string,
    userAgent: string,
    ip: string,
    refreshTokenJti: string,
  ): Promise<string> {
    const deviceId = this.generateDeviceId(userAgent, ip);
    const session: DeviceSession = {
      deviceId,
      userAgent,
      ip,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      refreshTokenJti,
    };

    await this.redisService.setJson(
      `${DeviceSessionsService.PREFIX}${userId}:${deviceId}`,
      session,
      DeviceSessionsService.TTL,
    );

    // Also track list of active device IDs for this user
    await this.redisService.set(
      `sessionlist:${userId}:${deviceId}`,
      '1',
      DeviceSessionsService.TTL,
    );

    return deviceId;
  }

  async updateLastActive(userId: string, deviceId: string): Promise<void> {
    const key = `${DeviceSessionsService.PREFIX}${userId}:${deviceId}`;
    const session = await this.redisService.getJson<DeviceSession>(key);
    if (session) {
      session.lastActive = new Date().toISOString();
      await this.redisService.setJson(key, session, DeviceSessionsService.TTL);
    }
  }

  async getActiveSessions(userId: string): Promise<DeviceSession[]> {
    // Get all session keys for this user using pattern scan
    const sessions: DeviceSession[] = [];
    try {
      let cursor = '0';
      const pattern = `${DeviceSessionsService.PREFIX}${userId}:*`;
      do {
        const [nextCursor, keys] = await this.redisService.scan(pattern, cursor);
        cursor = nextCursor;
        for (const key of keys) {
          const session = await this.redisService.getJson<DeviceSession>(key);
          if (session) sessions.push(session);
        }
      } while (cursor !== '0');
    } catch {
      // Redis unavailable
    }
    return sessions.sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
    );
  }

  async revokeSession(userId: string, deviceId: string): Promise<void> {
    await this.redisService.del(`${DeviceSessionsService.PREFIX}${userId}:${deviceId}`);
    await this.redisService.del(`sessionlist:${userId}:${deviceId}`);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.redisService.delPattern(`${DeviceSessionsService.PREFIX}${userId}:*`);
    await this.redisService.delPattern(`sessionlist:${userId}:*`);
  }

  async revokeByRefreshTokenJti(userId: string, jti: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId);
    for (const session of sessions) {
      if (session.refreshTokenJti === jti) {
        await this.revokeSession(userId, session.deviceId);
        break;
      }
    }
  }
}
