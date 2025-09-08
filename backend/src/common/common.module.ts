import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { SessionService } from './session.service';
import { AnalyticsService } from './analytics.service';
import { RateLimitGuard, UserRateLimitGuard } from './rate-limit.guard';

@Module({
  providers: [
    RedisService,
    SessionService,
    AnalyticsService,
    RateLimitGuard,
    UserRateLimitGuard,
  ],
  exports: [
    RedisService,
    SessionService,
    AnalyticsService,
    RateLimitGuard,
    UserRateLimitGuard,
  ],
})
export class CommonModule {}
