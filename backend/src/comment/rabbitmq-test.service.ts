import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class RabbitMQTestService {
  private readonly logger = new Logger(RabbitMQTestService.name);

  constructor(private rabbitMQService: RabbitMQService) {}

  /**
   * Test basic functionality of RabbitMQ
   */
  async testBasicFunctionality(): Promise<void> {
    try {
      this.logger.log('Starting RabbitMQ basic functionality test...');

      // Test 1: Publish message
      await this.rabbitMQService.publish('test.queue', {
        message: 'Hello RabbitMQ!',
        timestamp: new Date().toISOString(),
        testId: 'basic-test-001',
      });

      this.logger.log('✅ Test 1 passed: Message published successfully');

      // Test 2: Publish message to exchange
      await this.rabbitMQService.publishToExchange(
        'test.exchange',
        'test.routing.key',
        {
          message: 'Hello Exchange!',
          timestamp: new Date().toISOString(),
          testId: 'exchange-test-001',
        },
      );

      this.logger.log(
        '✅ Test 2 passed: Message published to exchange successfully',
      );

      this.logger.log('🎉 All basic functionality tests passed!');
    } catch (error) {
      this.logger.error('❌ RabbitMQ test failed:', error);
      throw error;
    }
  }

  /**
   * Test comment processing through RabbitMQ
   */
  async testCommentProcessing(): Promise<void> {
    try {
      this.logger.log('Starting comment processing test...');

      // Test comment creation
      await this.rabbitMQService.publish('comment.created', {
        commentId: 'test-comment-001',
        postId: 'test-post-001',
        content: 'This is a test comment',
        author: {
          userId: 'test-user-001',
          username: 'TestUser',
          email: 'test@example.com',
          homepage: 'https://example.com',
        },
        attachment: {
          data: 'base64-encoded-data',
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          originalName: 'test-image.jpg',
          size: 1024,
        },
        parentId: null,
      });

      this.logger.log('✅ Comment creation test passed');

      // Test comment reply
      await this.rabbitMQService.publish('comment.created', {
        commentId: 'test-reply-001',
        postId: 'test-post-001',
        content: 'This is a test reply',
        author: {
          userId: 'test-user-002',
          username: 'TestUser2',
          email: 'test2@example.com',
        },
        parentId: 'test-comment-001',
      });

      this.logger.log('✅ Comment reply test passed');

      // Test file processing
      await this.rabbitMQService.publish('file.processing', {
        commentId: 'test-comment-001',
        attachment: {
          data: 'base64-encoded-data',
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          originalName: 'test-image.jpg',
          size: 1024,
        },
      });

      this.logger.log('✅ File processing test passed');

      // Test email notification
      await this.rabbitMQService.publish('email.notification', {
        type: 'reply_notification',
        commentId: 'test-reply-001',
        parentId: 'test-comment-001',
        postId: 'test-post-001',
        author: {
          userId: 'test-user-002',
          username: 'TestUser2',
          email: 'test2@example.com',
        },
      });

      this.logger.log('✅ Email notification test passed');

      this.logger.log('🎉 All comment processing tests passed!');
    } catch (error) {
      this.logger.error('❌ Comment processing test failed:', error);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    try {
      this.logger.log('🚀 Starting all RabbitMQ tests...');

      await this.testBasicFunctionality();
      await this.testCommentProcessing();

      this.logger.log('🎉 All RabbitMQ tests completed successfully!');
    } catch (error) {
      this.logger.error('❌ RabbitMQ tests failed:', error);
      throw error;
    }
  }
}
