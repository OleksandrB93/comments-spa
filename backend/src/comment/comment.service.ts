import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCommentInput, CreateReplyInput } from './comment.input';
import { Comment as GraphQLComment, CommentsResponse } from './comment.model';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CommentGateway } from './comment.gateway';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private commentGateway: CommentGateway,
  ) {}

  async createComment(input: CreateCommentInput): Promise<GraphQLComment> {
    const { postId, content, userId, username, email, homepage, attachment } =
      input;
    const newComment = new this.commentModel({
      postId,
      content,
      author: { userId, username, email, homepage },
      attachment,
    });
    const savedComment = await newComment.save();
    const graphQLComment = await this.mapToGraphQLComment(savedComment);

    // Відправляємо новий коментар через WebSocket
    this.commentGateway.broadcastNewComment(postId, graphQLComment);

    return graphQLComment;
  }

  async createReply(input: CreateReplyInput): Promise<GraphQLComment> {
    const {
      postId,
      parentId,
      content,
      userId,
      username,
      email,
      homepage,
      attachment,
    } = input;
    const newReply = new this.commentModel({
      postId,
      parentId,
      content,
      author: { userId, username, email, homepage },
      attachment,
    });

    const savedReply = await newReply.save();
    const graphQLReply = await this.mapToGraphQLComment(savedReply);

    // Відправляємо новий відповідь через WebSocket
    this.commentGateway.broadcastNewComment(postId, graphQLReply);

    return graphQLReply;
  }

  async getComments(postId: string): Promise<GraphQLComment[]> {
    // Return flat list of all comments for this post
    const allComments = await this.commentModel
      .find({ postId })
      .sort({ createdAt: -1 })
      .exec();

    return await Promise.all(
      allComments.map((comment) => this.mapToGraphQLComment(comment, false)),
    );
  }

  async getCommentsPaginated(
    postId: string,
    page: number = 1,
    limit: number = 25,
  ): Promise<CommentsResponse> {
    const skip = (page - 1) * limit;

    // Get total count of top-level comments
    const totalCount = await this.commentModel
      .countDocuments({
        postId,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      })
      .exec();

    // Get top-level comments for pagination
    const topLevelComments = await this.commentModel
      .find({
        postId,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get ALL comments for this post (flat list)
    const allComments = await this.commentModel
      .find({ postId })
      .sort({ createdAt: -1 })
      .exec();

    const mappedTopComments = await Promise.all(
      topLevelComments.map((comment) =>
        this.mapToGraphQLComment(comment, false),
      ),
    );

    const allMappedComments = await Promise.all(
      allComments.map((comment) => this.mapToGraphQLComment(comment, false)),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      comments: mappedTopComments,
      allComments: allMappedComments, // Flat list for frontend hierarchy building
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async getCommentById(id: string): Promise<GraphQLComment | null> {
    const comment = await this.commentModel.findById(id).exec();

    return comment ? await this.mapToGraphQLComment(comment, true) : null;
  }

  async getAllComments(): Promise<GraphQLComment[]> {
    const comments = await this.commentModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return await Promise.all(
      comments.map((comment) => this.mapToGraphQLComment(comment, true)),
    );
  }

  private async mapToGraphQLComment(
    comment: any,
    includeReplies: boolean = false,
  ): Promise<GraphQLComment> {
    let mappedReplies: GraphQLComment[] = [];

    if (includeReplies && comment.replies) {
      // For pre-built hierarchy (from getCommentsPaginated)
      mappedReplies = await Promise.all(
        comment.replies.map((reply: any) =>
          this.mapToGraphQLComment(reply, true),
        ),
      );
    } else if (includeReplies) {
      // For single comments that need replies fetched
      const replies = await this.commentModel
        .find({ parentId: comment._id.toString() })
        .sort({ createdAt: 1 })
        .exec();

      mappedReplies = await Promise.all(
        replies.map((reply) => this.mapToGraphQLComment(reply, true)),
      );
    }

    return {
      id: comment._id.toString(),
      content: comment.content,
      author: {
        userId: comment.author.userId,
        username: comment.author.username,
        email: comment.author.email,
        homepage: comment.author.homepage,
      },
      attachment: comment.attachment
        ? {
            data: comment.attachment.data,
            filename: comment.attachment.filename,
            mimeType: comment.attachment.mimeType,
            originalName: comment.attachment.originalName,
            size: comment.attachment.size,
          }
        : undefined,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId?.toString(),
      postId: comment.postId,
      replies: mappedReplies,
    };
  }
}
