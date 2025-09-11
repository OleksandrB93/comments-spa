import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      'redis://:redis123@localhost:6379';

    // Main Redis client for caching
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });

    // Separate clients for pub/sub
    this.subscriber = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });

    this.publisher = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });

    // Test connection
    try {
      await this.client.ping();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJson(key: string, value: any, ttl?: number): Promise<'OK'> {
    return this.set(key, JSON.stringify(value), ttl);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: 'WITHSCORES',
  ): Promise<string[]> {
    if (withScores) {
      return this.client.zrevrange(key, start, stop, withScores);
    }
    return this.client.zrevrange(key, start, stop);
  }

  async zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<string> {
    return this.client.zincrby(key, increment, member);
  }

  async zremrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    return this.client.zremrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return this.publisher.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  // Rate limiting
  async rateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - window * 1000;

    // Remove old entries
    await this.client.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const currentCount = await this.client.zcard(key);

    if (currentCount >= limit) {
      // Get the oldest request to calculate reset time
      const oldestRequest = await this.client.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime =
        oldestRequest.length > 0
          ? parseInt(oldestRequest[1]) + window * 1000
          : now + window * 1000;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Add current request
    await this.client.zadd(key, now, `${now}-${Math.random()}`);
    await this.client.expire(key, window);

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetTime: now + window * 1000,
    };
  }

  // Cache invalidation helpers
  async invalidateCommentCache(postId: string): Promise<void> {
    const patterns = [
      `comments:post:${postId}:*`,
      `comments:paginated:${postId}:*`,
      `comments:count:${postId}`,
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [`user:${userId}:*`, `session:${userId}`];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }
}
