import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import {
  CreateCommentInput,
  CreateReplyInput,
  Comment,
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
    return this.commentService.getComments(postId);
  }
}
