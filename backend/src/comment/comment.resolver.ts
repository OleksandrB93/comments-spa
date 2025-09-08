import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ValidationPipe } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentInput, CreateReplyInput } from './comment.input';
import { Comment, CommentsResponse } from './comment.model';
import { RabbitMQTestService } from './rabbitmq-test.service';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    private readonly rabbitMQTestService: RabbitMQTestService,
  ) {}

  @Mutation(() => Comment)
  async createComment(
    @Args('input') input: CreateCommentInput,
  ): Promise<Comment> {
    return this.commentService.createComment(input);
  }

  @Mutation(() => Comment)
  async createReply(@Args('input') input: CreateReplyInput): Promise<Comment> {
    return this.commentService.createReply(input);
  }

  @Query(() => [Comment])
  async comments(@Args('postId') postId: string): Promise<Comment[]> {
    const result = await this.commentService.getComments(postId);
    return result;
  }

  @Query(() => CommentsResponse)
  async commentsPaginated(
    @Args('postId') postId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 25 }) limit: number,
  ): Promise<CommentsResponse> {
    return this.commentService.getCommentsPaginated(postId, page, limit);
  }

  @Mutation(() => String)
  async testRabbitMQ(): Promise<string> {
    try {
      await this.rabbitMQTestService.runAllTests();
      return 'RabbitMQ tests completed successfully! Check server logs for details.';
    } catch (error) {
      return `RabbitMQ tests failed: ${error.message}`;
    }
  }
}
