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
    console.log('Comment created in MongoDB:', savedComment);

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
    console.log('Reply created in MongoDB:', savedReply);

    return this.mapToGraphQLComment(savedReply);
  }

  async getComments(postId: string): Promise<GraphQLComment[]> {
    const comments = await this.commentModel
      .find({ postId, parentId: null })
      .sort({ createdAt: -1 })
      .exec();

    return comments.map((comment) => this.mapToGraphQLComment(comment));
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

  private mapToGraphQLComment(comment: CommentDocument): GraphQLComment {
    return {
      id: comment._id.toString(),
      content: comment.content,
      author: {
        id: comment._id.toString(), // Using comment ID as author ID for now
        username: comment.author.username,
        email: comment.author.email,
        homepage: comment.author.homepage,
      },
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId?.toString(),
      postId: comment.postId,
      replies: [], // We'll implement nested replies later
    };
  }
}
