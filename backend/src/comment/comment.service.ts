import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateCommentInput,
  CreateReplyInput,
  Comment as GraphQLComment,
} from './comment.entity';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async createComment(input: CreateCommentInput): Promise<GraphQLComment> {
    const newComment = new this.commentModel({
      content: input.content,
      author: {
        username: input.author.username,
        email: input.author.email,
        homepage: input.author.homepage,
      },
      postId: input.postId,
    });

    const savedComment = await newComment.save();

    return this.mapToGraphQLComment(savedComment);
  }

  async createReply(input: CreateReplyInput): Promise<GraphQLComment> {
    const newReply = new this.commentModel({
      content: input.content,
      author: {
        username: input.author.username,
        email: input.author.email,
        homepage: input.author.homepage,
      },
      postId: input.postId,
      parentId: new Types.ObjectId(input.parentId),
    });

    const savedReply = await newReply.save();

    return this.mapToGraphQLComment(savedReply);
  }

  async getComments(postId: string): Promise<GraphQLComment[]> {
    // Get only top-level comments (no parentId or parentId is null)
    const comments = await this.commentModel
      .find({
        postId,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      })
      .sort({ createdAt: -1 })
      .exec();

    // For each comment, get its replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.commentModel
          .find({ parentId: comment._id })
          .sort({ createdAt: 1 })
          .exec();

        return {
          ...comment.toObject(),
          replies: replies,
        };
      }),
    );

    const result = commentsWithReplies.map((comment) =>
      this.mapToGraphQLComment(comment),
    );

    return result;
  }

  async getCommentById(id: string): Promise<GraphQLComment | null> {
    const comment = await this.commentModel.findById(id).exec();

    return comment ? this.mapToGraphQLComment(comment) : null;
  }

  async getAllComments(): Promise<GraphQLComment[]> {
    const comments = await this.commentModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return comments.map((comment) => this.mapToGraphQLComment(comment));
  }

  private mapToGraphQLComment(comment: any): GraphQLComment {
    return {
      id: comment._id.toString(),
      content: comment.content,
      author: {
        id: comment.author._id?.toString() || comment._id.toString(), // Use author ID if available, fallback to comment ID
        username: comment.author.username,
        email: comment.author.email,
        homepage: comment.author.homepage,
      },
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId?.toString(),
      postId: comment.postId,
      replies:
        comment.replies?.map((reply: any) => this.mapToGraphQLComment(reply)) ||
        [],
    };
  }
}
