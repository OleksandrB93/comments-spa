import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { AnalyticsService, CommentStats } from '../common/analytics.service';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => String, { name: 'commentStats' })
  async getCommentStats(): Promise<string> {
    const stats = await this.analyticsService.getCommentStats();
    return JSON.stringify(stats);
  }

  @Query(() => String, { name: 'topCommenters' })
  async getTopCommenters(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<string> {
    const commenters = await this.analyticsService.getTopCommenters(limit);
    return JSON.stringify(commenters);
  }

  @Query(() => String, { name: 'popularPosts' })
  async getPopularPosts(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<string> {
    const posts = await this.analyticsService.getPopularPosts(limit);
    return JSON.stringify(posts);
  }

  @Query(() => Int, { name: 'postCommentCount' })
  async getPostCommentCount(@Args('postId') postId: string): Promise<number> {
    return this.analyticsService.getPostCommentCount(postId);
  }

  @Query(() => Int, { name: 'userCommentCount' })
  async getUserCommentCount(@Args('userId') userId: string): Promise<number> {
    return this.analyticsService.getUserCommentCount(userId);
  }

  @Query(() => Int, { name: 'userCommentCountToday' })
  async getUserCommentCountToday(
    @Args('userId') userId: string,
  ): Promise<number> {
    return this.analyticsService.getUserCommentCountToday(userId);
  }

  @Query(() => String, { name: 'pageViewStats' })
  async getPageViewStats(@Args('postId') postId: string): Promise<string> {
    const stats = await this.analyticsService.getPageViewStats(postId);
    return JSON.stringify(stats);
  }
}
