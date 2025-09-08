import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface UserSession {
  userId: string;
  username: string;
  email: string;
  homepage?: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

  async createSession(
    userId: string,
    userData: {
      username: string;
      email: string;
      homepage?: string;
    },
    ipAddress: string,
    userAgent: string,
    ttl: number = 3600, // 1 hour default
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: UserSession = {
      userId,
      username: userData.username,
      email: userData.email,
      homepage: userData.homepage,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent,
    };

    const sessionKey = `session:${sessionId}`;
    await this.redisService.setJson(sessionKey, session, ttl);

    // Also store user's active sessions
    const userSessionsKey = `user:${userId}:sessions`;
    await this.redisService.sadd(userSessionsKey, sessionId);
    await this.redisService.expire(userSessionsKey, ttl);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    const sessionKey = `session:${sessionId}`;
    const session = await this.redisService.getJson<UserSession>(sessionKey);

    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await this.redisService.setJson(sessionKey, session, 3600); // Refresh TTL
    }

    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = new Date();
      const sessionKey = `session:${sessionId}`;
      await this.redisService.setJson(sessionKey, session, 3600);
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      // Remove session
      const sessionKey = `session:${sessionId}`;
      await this.redisService.del(sessionKey);

      // Remove from user's active sessions
      const userSessionsKey = `user:${session.userId}:sessions`;
      await this.redisService.srem(userSessionsKey, sessionId);
    }
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await this.redisService.smembers(userSessionsKey);

    if (sessionIds.length > 0) {
      // Remove all sessions
      const sessionKeys = sessionIds.map((id) => `session:${id}`);
      if (sessionKeys.length > 0) {
        await this.redisService.del(...sessionKeys);
      }

      // Clear user sessions set
      await this.redisService.del(userSessionsKey);
    }
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await this.redisService.smembers(userSessionsKey);

    const sessions: UserSession[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  async extendSession(sessionId: string, ttl: number = 3600): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      const sessionKey = `session:${sessionId}`;
      await this.redisService.setJson(sessionKey, session, ttl);
    }
  }

  // Cleanup expired sessions (can be called periodically)
  async cleanupExpiredSessions(): Promise<number> {
    // Redis automatically handles TTL, but we can clean up user session sets
    const pattern = 'user:*:sessions';
    const userSessionKeys = await this.redisService.keys(pattern);

    let cleanedCount = 0;
    for (const userSessionKey of userSessionKeys) {
      const sessionIds = await this.redisService.smembers(userSessionKey);
      const validSessions: string[] = [];

      for (const sessionId of sessionIds) {
        if (await this.isSessionValid(sessionId)) {
          validSessions.push(sessionId);
        }
      }

      if (validSessions.length === 0) {
        await this.redisService.del(userSessionKey);
        cleanedCount++;
      } else if (validSessions.length !== sessionIds.length) {
        // Update the set with only valid sessions
        await this.redisService.del(userSessionKey);
        if (validSessions.length > 0) {
          await this.redisService.sadd(userSessionKey, ...validSessions);
        }
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
