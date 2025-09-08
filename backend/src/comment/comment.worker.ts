import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CommentGateway } from './comment.gateway';
import { CommentService } from './comment.service';

export interface CommentCreatedMessage {
  commentId: string;
  postId: string;
  attachment?: {
    data: string;
    filename: string;
    mimeType: string;
    originalName: string;
    size: number;
  };
  author: {
    userId: string;
    username: string;
    email: string;
    homepage?: string;
  };
  content: string;
  parentId?: string;
}

export interface FileProcessingMessage {
  commentId: string;
  attachment: {
    data: string;
    filename: string;
    mimeType: string;
    originalName: string;
    size: number;
  };
}

@Injectable()
export class CommentWorker implements OnModuleInit {
  private readonly logger = new Logger(CommentWorker.name);

  constructor(
    private rabbitMQService: RabbitMQService,
    private commentGateway: CommentGateway,
    private commentService: CommentService,
  ) {}

  async onModuleInit() {
    // Wait for RabbitMQ to connect
    await this.waitForRabbitMQ();
    // Subscribe to different types of messages
    await this.setupSubscriptions();
  }

  private async waitForRabbitMQ(): Promise<void> {
    let retries = 30; // 30 seconds wait
    while (retries > 0) {
      try {
        // Check if RabbitMQ is connected
        await this.rabbitMQService.publish('health.check', { test: true });
        this.logger.log('RabbitMQ is ready');
        return;
      } catch (error) {
        this.logger.warn(`Waiting for RabbitMQ... (${retries} attempts left)`);
        retries--;
        if (retries === 0) {
          this.logger.error('RabbitMQ connection timeout');
          return; // Don't throw an error to not block the startup
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async setupSubscriptions() {
    // 1. Process created comments
    await this.rabbitMQService.subscribe(
      'comment.created',
      this.handleCommentCreated.bind(this),
    );

    // 2. Process files
    await this.rabbitMQService.subscribe(
      'file.processing',
      this.handleFileProcessing.bind(this),
    );

    // 3. Email notification
    await this.rabbitMQService.subscribe(
      'email.notification',
      this.handleEmailNotification.bind(this),
    );

    // 4. WebSocket broadcast through exchange
    await this.rabbitMQService.subscribeToExchange(
      'comment.events',
      'comment.created',
      this.handleWebSocketBroadcast.bind(this),
    );

    this.logger.log('Comment worker subscriptions set up');
  }

  /**
   * Process created comment
   */
  private async handleCommentCreated(
    message: CommentCreatedMessage,
  ): Promise<void> {
    try {
      this.logger.log(`Processing comment created: ${message.commentId}`);

      // 1. If there is a file - send to processing
      if (message.attachment) {
        await this.rabbitMQService.publish('file.processing', {
          commentId: message.commentId,
          attachment: message.attachment,
        });
      }

      // 2. Send email notification (if it is a reply)
      if (message.parentId) {
        await this.rabbitMQService.publish('email.notification', {
          type: 'reply_notification',
          commentId: message.commentId,
          parentId: message.parentId,
          postId: message.postId,
          author: message.author,
        });
      }

      // 3. Broadcast through WebSocket exchange
      await this.rabbitMQService.publishToExchange(
        'comment.events',
        'comment.created',
        {
          type: 'NEW_COMMENT',
          data: {
            id: message.commentId,
            postId: message.postId,
            content: message.content,
            author: message.author,
            attachment: message.attachment,
            parentId: message.parentId,
          },
        },
      );

      this.logger.log(`Comment ${message.commentId} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Error processing comment created: ${message.commentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process files (change size, optimize, validate)
   */
  private async handleFileProcessing(
    message: FileProcessingMessage,
  ): Promise<void> {
    try {
      this.logger.log(`Processing file for comment: ${message.commentId}`);

      // Here can add file processing logic:
      // - Change image size
      // - Generate thumbnails
      // - Validation of files
      // - Scan for viruses

      // Example of image processing
      if (message.attachment.mimeType.startsWith('image/')) {
        // Simulate image processing
        await this.processImage(message.attachment);
      }

      // After processing, update the comment
      await this.updateCommentAfterFileProcessing(
        message.commentId,
        message.attachment,
      );

      this.logger.log(
        `File processing completed for comment: ${message.commentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing file for comment: ${message.commentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process email notification
   */
  private async handleEmailNotification(message: any): Promise<void> {
    try {
      this.logger.log(`Sending email notification: ${message.type}`);

      // Here can add email sending logic:
      // - Get email of the parent comment author
      // - Format the message
      // - Send through email service

      // Simulate email sending
      await this.sendEmailNotification(message);

      this.logger.log(`Email notification sent: ${message.type}`);
    } catch (error) {
      this.logger.error(
        `Error sending email notification: ${message.type}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process WebSocket broadcast
   */
  private async handleWebSocketBroadcast(message: any): Promise<void> {
    try {
      this.logger.log(`Broadcasting WebSocket message: ${message.type}`);

      // Send through WebSocket Gateway
      if (message.type === 'NEW_COMMENT') {
        this.commentGateway.broadcastNewComment(
          message.data.postId,
          message.data,
        );
      } else if (message.type === 'UPDATED_COMMENT') {
        this.commentGateway.broadcastUpdatedComment(
          message.data.postId,
          message.data,
        );
      } else if (message.type === 'DELETED_COMMENT') {
        this.commentGateway.broadcastDeletedComment(
          message.data.postId,
          message.data.id,
        );
      }

      this.logger.log(`WebSocket message broadcasted: ${message.type}`);
    } catch (error) {
      this.logger.error(
        `Error broadcasting WebSocket message: ${message.type}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process image (change size, optimize)
   */
  private async processImage(attachment: any): Promise<void> {
    // Here you can use sharp for image processing
    // const sharp = require('sharp');
    // const buffer = Buffer.from(attachment.data, 'base64');
    // const resized = await sharp(buffer).resize(320, 240).jpeg({ quality: 80 }).toBuffer();

    // Simulate image processing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.logger.log(`Image processed: ${attachment.originalName}`);
  }

  /**
   * Update comment after file processing
   */
  private async updateCommentAfterFileProcessing(
    commentId: string,
    processedAttachment: any,
  ): Promise<void> {
    // Here you can update the comment in the database with the processed file
    this.logger.log(`Comment ${commentId} updated with processed file`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(message: any): Promise<void> {
    // Here you can integrate email service (SendGrid, AWS SES, etc.)
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.logger.log(`Email sent to author of comment: ${message.parentId}`);
  }
}
