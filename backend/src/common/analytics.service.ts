import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface CommentStats {
  totalComments: number;
  commentsToday: number;
  commentsThisWeek: number;
  commentsThisMonth: number;
  topCommenters: Array<{
    username: string;
    commentCount: number;
  }>;
  popularPosts: Array<{
    postId: string;
    commentCount: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(private redisService: RedisService) {}

  // Track comment creation
  async trackCommentCreation(
    postId: string,
    userId: string,
    username: string,
  ): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = this.getWeekStart(now).toISOString().split('T')[0];
    const monthStart = now.toISOString().substring(0, 7); // YYYY-MM

    // Increment counters
    await Promise.all([
      // Global counters
      this.redisService.incr('stats:comments:total'),
      this.redisService.incr(`stats:comments:day:${today}`),
      this.redisService.incr(`stats:comments:week:${weekStart}`),
      this.redisService.incr(`stats:comments:month:${monthStart}`),

      // Post-specific counters
      this.redisService.incr(`stats:post:${postId}:comments`),

      // User-specific counters
      this.redisService.incr(`stats:user:${userId}:comments`),
      this.redisService.incr(`stats:user:${userId}:comments:day:${today}`),
    ]);

    // Update top commenters (sorted set)
    await this.redisService.zincrby('stats:top_commenters', 1, username);

    // Update popular posts (sorted set)
    await this.redisService.zincrby('stats:popular_posts', 1, postId);

    // Set TTL for daily/weekly/monthly counters
    await Promise.all([
      this.redisService.expire(`stats:comments:day:${today}`, 86400 * 7), // 7 days
      this.redisService.expire(`stats:comments:week:${weekStart}`, 86400 * 30), // 30 days
      this.redisService.expire(
        `stats:user:${userId}:comments:day:${today}`,
        86400 * 7,
      ), // 7 days
    ]);
  }

  // Track comment deletion
  async trackCommentDeletion(
    postId: string,
    userId: string,
    username: string,
  ): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = this.getWeekStart(now).toISOString().split('T')[0];
    const monthStart = now.toISOString().substring(0, 7); // YYYY-MM

    // Decrement counters (but don't go below 0)
    await Promise.all([
      // Global counters
      this.redisService.decr('stats:comments:total'),
      this.redisService.decr(`stats:comments:day:${today}`),
      this.redisService.decr(`stats:comments:week:${weekStart}`),
      this.redisService.decr(`stats:comments:month:${monthStart}`),

      // Post-specific counters
      this.redisService.decr(`stats:post:${postId}:comments`),

      // User-specific counters
      this.redisService.decr(`stats:user:${userId}:comments`),
      this.redisService.decr(`stats:user:${userId}:comments:day:${today}`),
    ]);

    // Update top commenters (sorted set) - decrement
    await this.redisService.zincrby('stats:top_commenters', -1, username);

    // Update popular posts (sorted set) - decrement
    await this.redisService.zincrby('stats:popular_posts', -1, postId);
  }

  // Get comment statistics
  async getCommentStats(): Promise<CommentStats> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = this.getWeekStart(now).toISOString().split('T')[0];
    const monthStart = now.toISOString().substring(0, 7);

    const [
      totalComments,
      commentsToday,
      commentsThisWeek,
      commentsThisMonth,
      topCommenters,
      popularPosts,
    ] = await Promise.all([
      this.redisService.get('stats:comments:total') || '0',
      this.redisService.get(`stats:comments:day:${today}`) || '0',
      this.redisService.get(`stats:comments:week:${weekStart}`) || '0',
      this.redisService.get(`stats:comments:month:${monthStart}`) || '0',
      this.getTopCommenters(10),
      this.getPopularPosts(10),
    ]);

    return {
      totalComments: parseInt(totalComments || '0'),
      commentsToday: parseInt(commentsToday || '0'),
      commentsThisWeek: parseInt(commentsThisWeek || '0'),
      commentsThisMonth: parseInt(commentsThisMonth || '0'),
      topCommenters,
      popularPosts,
    };
  }

  // Get top commenters
  async getTopCommenters(
    limit: number = 10,
  ): Promise<Array<{ username: string; commentCount: number }>> {
    const results = await this.redisService.zrevrange(
      'stats:top_commenters',
      0,
      limit - 1,
      'WITHSCORES',
    );
    const commenters: Array<{ username: string; commentCount: number }> = [];

    for (let i = 0; i < results.length; i += 2) {
      commenters.push({
        username: results[i],
        commentCount: parseInt(results[i + 1]),
      });
    }

    return commenters;
  }

  // Get popular posts
  async getPopularPosts(
    limit: number = 10,
  ): Promise<Array<{ postId: string; commentCount: number }>> {
    const results = await this.redisService.zrevrange(
      'stats:popular_posts',
      0,
      limit - 1,
      'WITHSCORES',
    );
    const posts: Array<{ postId: string; commentCount: number }> = [];

    for (let i = 0; i < results.length; i += 2) {
      posts.push({
        postId: results[i],
        commentCount: parseInt(results[i + 1]),
      });
    }

    return posts;
  }

  // Get post comment count
  async getPostCommentCount(postId: string): Promise<number> {
    const count = await this.redisService.get(`stats:post:${postId}:comments`);
    return count ? parseInt(count) : 0;
  }

  // Get user comment count
  async getUserCommentCount(userId: string): Promise<number> {
    const count = await this.redisService.get(`stats:user:${userId}:comments`);
    return count ? parseInt(count) : 0;
  }

  // Get user comment count for today
  async getUserCommentCountToday(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const count = await this.redisService.get(
      `stats:user:${userId}:comments:day:${today}`,
    );
    return count ? parseInt(count) : 0;
  }

  // Cache popular comments for a post
  async cachePopularComments(
    postId: string,
    comments: any[],
    ttl: number = 300,
  ): Promise<void> {
    const cacheKey = `popular:comments:${postId}`;
    await this.redisService.setJson(cacheKey, comments, ttl);
  }

  // Get cached popular comments
  async getCachedPopularComments(postId: string): Promise<any[] | null> {
    const cacheKey = `popular:comments:${postId}`;
    return await this.redisService.getJson<any[]>(cacheKey);
  }

  // Track page views
  async trackPageView(postId: string, ipAddress: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Track unique visitors per day
    const uniqueVisitorsKey = `stats:post:${postId}:visitors:${today}`;
    await this.redisService.sadd(uniqueVisitorsKey, ipAddress);
    await this.redisService.expire(uniqueVisitorsKey, 86400 * 7); // 7 days

    // Track total page views
    await this.redisService.incr(`stats:post:${postId}:views`);
  }

  // Get page view statistics
  async getPageViewStats(postId: string): Promise<{
    totalViews: number;
    uniqueVisitorsToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [totalViews, uniqueVisitorsToday] = await Promise.all([
      this.redisService.get(`stats:post:${postId}:views`) || '0',
      this.redisService.scard(`stats:post:${postId}:visitors:${today}`),
    ]);

    return {
      totalViews: parseInt(totalViews || '0'),
      uniqueVisitorsToday,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
}
