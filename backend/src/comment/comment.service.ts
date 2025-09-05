import { Injectable } from '@nestjs/common';
import {
  CreateCommentInput,
  CreateReplyInput,
  Comment,
} from './comment.entity';

@Injectable()
export class CommentService {
  // Mock data for demonstration
  private comments: Comment[] = [];

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content: input.content,
      author: {
        id: `author-${Date.now()}`,
        username: input.author.username,
        email: input.author.email,
        homepage: input.author.homepage,
      },
      createdAt: new Date().toISOString(),
      postId: input.postId,
    };

    this.comments.push(newComment);
    console.log('Comment created:', newComment);
    return newComment;
  }

  async createReply(input: CreateReplyInput): Promise<Comment> {
    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      content: input.content,
      author: {
        id: `author-${Date.now()}`,
        username: input.author.username,
        email: input.author.email,
        homepage: input.author.homepage,
      },
      createdAt: new Date().toISOString(),
      parentId: input.parentId,
      postId: input.postId,
    };

    this.comments.push(newReply);
    console.log('Reply created:', newReply);
    return newReply;
  }

  async getComments(postId: string): Promise<Comment[]> {
    return this.comments.filter((comment) => comment.postId === postId);
  }
}
