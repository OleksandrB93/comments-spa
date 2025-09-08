import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RedisService } from './redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Get client IP
    const clientIp = this.getClientIp(request);

    // Rate limit: 10 comments per minute per IP
    const rateLimitResult = await this.redisService.rateLimit(
      `rate_limit:comments:${clientIp}`,
      10, // 10 requests
      60, // per 60 seconds
    );

    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      throw new HttpException(
        {
          message: 'Rate limit exceeded. Too many comments.',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
          resetTime: resetTime.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers to response
    const response = ctx.getContext().res;
    if (response) {
      response.setHeader('X-RateLimit-Limit', '10');
      response.setHeader(
        'X-RateLimit-Remaining',
        rateLimitResult.remaining.toString(),
      );
      response.setHeader(
        'X-RateLimit-Reset',
        new Date(rateLimitResult.resetTime).toISOString(),
      );
    }

    return true;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Get user ID from request (you might need to adjust this based on your auth implementation)
    const userId =
      request.user?.id || request.headers['user-id'] || 'anonymous';

    // Rate limit: 20 comments per hour per user
    const rateLimitResult = await this.redisService.rateLimit(
      `rate_limit:user:${userId}`,
      20, // 20 requests
      3600, // per hour (3600 seconds)
    );

    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      throw new HttpException(
        {
          message:
            'User rate limit exceeded. Too many comments from this user.',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
          resetTime: resetTime.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
