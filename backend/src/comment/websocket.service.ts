import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { CommentGateway } from './comment.gateway';
import { Comment as GraphQLComment } from './comment.model';

@Injectable()
export class WebSocketService {
  constructor(
    @Inject(forwardRef(() => CommentGateway))
    private commentGateway: CommentGateway,
  ) {}

  async broadcastNewComment(postId: string, comment: GraphQLComment) {
    await this.commentGateway.broadcastNewComment(postId, comment);
  }

  async broadcastNewReply(postId: string, reply: GraphQLComment) {
    await this.commentGateway.broadcastNewComment(postId, reply);
  }
}
