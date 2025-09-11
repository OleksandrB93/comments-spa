import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateCommentInput,
  CreateReplyInput,
  DeleteCommentInput,
} from './comment.input';
import { Comment as GraphQLComment, CommentsResponse } from './comment.model';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CommentGateway } from './comment.gateway';
import { RabbitMQService } from '../rabbit/rabbitmq.service';
import { RedisService } from '../common/redis.service';
import { AnalyticsService } from '../common/analytics.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private commentGateway: CommentGateway,
    private rabbitMQService: RabbitMQService,
    private redisService: RedisService,
    private analyticsService: AnalyticsService,
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

    // Invalidate cache for this post
    await this.redisService.invalidateCommentCache(postId);

    // Track analytics
    await this.analyticsService.trackCommentCreation(postId, userId, username);

    // Send message to RabbitMQ for asynchronous processing
    await this.rabbitMQService.publish('comment.created', {
      commentId: savedComment._id.toString(),
      postId,
      content,
      author: { userId, username, email, homepage },
      attachment,
      parentId: null,
    });

    // Send new comment through WebSocket (synchronously for speed)
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

    // Invalidate cache for this post
    await this.redisService.invalidateCommentCache(postId);

    // Track analytics
    await this.analyticsService.trackCommentCreation(postId, userId, username);

    // Send message to RabbitMQ for asynchronous processing
    await this.rabbitMQService.publish('comment.created', {
      commentId: savedReply._id.toString(),
      postId,
      content,
      author: { userId, username, email, homepage },
      attachment,
      parentId,
    });

    // Send new reply through WebSocket (synchronously for speed)
    this.commentGateway.broadcastNewComment(postId, graphQLReply);

    return graphQLReply;
  }

  async getComments(postId: string): Promise<GraphQLComment[]> {
    const cacheKey = `comments:post:${postId}:all`;

    // Try to get from cache first
    const cachedComments =
      await this.redisService.getJson<GraphQLComment[]>(cacheKey);
    if (cachedComments) {
      console.log(`📦 Cache hit for comments: ${postId}`);
      return cachedComments;
    }

    console.log(`💾 Cache miss for comments: ${postId}, fetching from DB`);

    // Return flat list of all comments for this post
    const allComments = await this.commentModel
      .find({ postId })
      .sort({ createdAt: -1 })
      .exec();

    const mappedComments = await Promise.all(
      allComments.map((comment) => this.mapToGraphQLComment(comment, false)),
    );

    // Cache for 5 minutes
    await this.redisService.setJson(cacheKey, mappedComments, 300);

    return mappedComments;
  }

  async getCommentsPaginated(
    postId: string,
    page: number = 1,
    limit: number = 25,
  ): Promise<CommentsResponse> {
    const cacheKey = `comments:paginated:${postId}:${page}:${limit}`;
    const countCacheKey = `comments:count:${postId}`;

    // Try to get from cache first
    const cachedResponse =
      await this.redisService.getJson<CommentsResponse>(cacheKey);
    if (cachedResponse) {
      console.log(
        `📦 Cache hit for paginated comments: ${postId}:${page}:${limit}`,
      );
      return cachedResponse;
    }

    console.log(
      `💾 Cache miss for paginated comments: ${postId}:${page}:${limit}, fetching from DB`,
    );

    const skip = (page - 1) * limit;

    // Try to get total count from cache first
    let totalCount = await this.redisService.get(countCacheKey);
    if (!totalCount) {
      // Get total count of top-level comments
      totalCount = (
        await this.commentModel
          .countDocuments({
            postId,
            $or: [{ parentId: null }, { parentId: { $exists: false } }],
          })
          .exec()
      ).toString();

      // Cache count for 10 minutes
      await this.redisService.set(countCacheKey, totalCount, 600);
    } else {
      totalCount = parseInt(totalCount).toString();
    }

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

    // Get ALL comments for this post (flat list) - use cached version if available
    const allCommentsCacheKey = `comments:post:${postId}:all`;
    let allMappedComments =
      await this.redisService.getJson<GraphQLComment[]>(allCommentsCacheKey);

    if (!allMappedComments) {
      const allComments = await this.commentModel
        .find({ postId })
        .sort({ createdAt: -1 })
        .exec();

      allMappedComments = await Promise.all(
        allComments.map((comment) => this.mapToGraphQLComment(comment, false)),
      );

      // Cache all comments for 5 minutes
      await this.redisService.setJson(
        allCommentsCacheKey,
        allMappedComments,
        300,
      );
    }

    const mappedTopComments = await Promise.all(
      topLevelComments.map((comment) =>
        this.mapToGraphQLComment(comment, false),
      ),
    );

    const totalPages = Math.ceil(parseInt(totalCount) / limit);

    const response: CommentsResponse = {
      comments: mappedTopComments,
      allComments: allMappedComments, // Flat list for frontend hierarchy building
      totalCount: parseInt(totalCount),
      page,
      limit,
      totalPages,
    };

    // Cache paginated response for 3 minutes
    await this.redisService.setJson(cacheKey, response, 180);

    return response;
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

  async deleteComment(input: DeleteCommentInput): Promise<boolean> {
    const { commentId, userId } = input;

    // Find the comment to verify ownership
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author of the comment
    if (comment.author.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    // Delete the comment and all its replies
    const result = await this.commentModel.deleteOne({ _id: commentId }).exec();

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete comment');
    }

    // Count all comments that will be deleted (including replies)
    const repliesCount = await this.countCommentsToDelete(commentId);

    // Also delete all replies to this comment (recursively)
    await this.deleteCommentAndReplies(commentId);

    // Invalidate cache for this post
    await this.redisService.invalidateCommentCache(comment.postId);

    // Track analytics for the main comment
    await this.analyticsService.trackCommentDeletion(
      comment.postId,
      userId,
      comment.author.username,
    );

    // Track analytics for all replies (if any)
    if (repliesCount > 0) {
      for (let i = 0; i < repliesCount; i++) {
        await this.analyticsService.trackCommentDeletion(
          comment.postId,
          userId,
          comment.author.username,
        );
      }
    }

    // Send message to RabbitMQ for asynchronous processing
    await this.rabbitMQService.publish('comment.deleted', {
      commentId,
      postId: comment.postId,
      author: comment.author,
    });

    // Broadcast deletion through WebSocket
    this.commentGateway.broadcastDeletedComment(comment.postId, commentId);

    return true;
  }

  /**
   * Recursively delete a comment and all its replies
   */
  private async deleteCommentAndReplies(commentId: string): Promise<void> {
    // Find all direct replies to this comment
    const replies = await this.commentModel
      .find({ parentId: commentId })
      .exec();

    // Recursively delete all replies first
    for (const reply of replies) {
      await this.deleteCommentAndReplies(reply._id.toString());
    }

    // Delete all direct replies
    await this.commentModel.deleteMany({ parentId: commentId }).exec();
  }

  /**
   * Count all comments that will be deleted (including replies)
   */
  private async countCommentsToDelete(commentId: string): Promise<number> {
    let count = 0;

    // Find all direct replies to this comment
    const replies = await this.commentModel
      .find({ parentId: commentId })
      .exec();

    // Count replies recursively
    for (const reply of replies) {
      count += await this.countCommentsToDelete(reply._id.toString());
    }

    // Add direct replies count
    count += replies.length;

    return count;
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
