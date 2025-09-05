import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import {
  CreateCommentInput,
  CreateReplyInput,
  Comment,
  CommentsResponse,
} from './comment.entity';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

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
}
