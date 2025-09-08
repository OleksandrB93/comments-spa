import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl =
        this.configService.get<string>('RABBITMQ_URL') ||
        'amqp://admin:rabbit123@localhost:5672';

      // Wait for RabbitMQ to be ready
      let retries = 10;
      while (retries > 0) {
        try {
          this.connection = await amqp.connect(rabbitmqUrl);
          this.channel = await this.connection.createChannel();
          break;
        } catch (error) {
          this.logger.warn(
            `RabbitMQ connection attempt failed, retrying... (${retries} attempts left)`,
          );
          retries--;
          if (retries === 0) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      this.logger.log('Connected to RabbitMQ');

      // Error handling
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  /**
   * Publish message to queue
   */
  async publish(queueName: string, message: any): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel is not initialized');
      }

      // Create queue if it doesn't exist
      await this.channel.assertQueue(queueName, {
        durable: true, // Queue will be saved when RabbitMQ restarts
      });

      // Send message
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const sent = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true, // Message will be saved to disk
      });

      if (sent) {
        this.logger.log(`Message published to queue: ${queueName}`);
      } else {
        this.logger.warn(`Failed to publish message to queue: ${queueName}`);
      }
    } catch (error) {
      this.logger.error(
        `Error publishing message to queue ${queueName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribe to queue and process messages
   */
  async subscribe(
    queueName: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel is not initialized');
      }

      // Create queue
      await this.channel.assertQueue(queueName, {
        durable: true,
      });

      // Configure message processing
      await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const messageContent = JSON.parse(msg.content.toString());
            this.logger.log(`Received message from queue: ${queueName}`);

            await callback(messageContent);

            // Confirm message processing
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(
              `Error processing message from queue ${queueName}:`,
              error,
            );
            // Reject message (can configure retry logic)
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`Subscribed to queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Error subscribing to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Publish message to exchange (for broadcast)
   */
  async publishToExchange(
    exchangeName: string,
    routingKey: string,
    message: any,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel is not initialized');
      }

      // Create exchange
      await this.channel.assertExchange(exchangeName, 'topic', {
        durable: true,
      });

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const sent = this.channel.publish(
        exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true,
        },
      );

      if (sent) {
        this.logger.log(
          `Message published to exchange: ${exchangeName} with routing key: ${routingKey}`,
        );
      } else {
        this.logger.warn(
          `Failed to publish message to exchange: ${exchangeName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error publishing message to exchange ${exchangeName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribe to exchange
   */
  async subscribeToExchange(
    exchangeName: string,
    routingKey: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel is not initialized');
      }

      // Create exchange
      await this.channel.assertExchange(exchangeName, 'topic', {
        durable: true,
      });

      // Create temporary queue
      const queueResult = await this.channel.assertQueue('', {
        exclusive: true, // Queue will be removed when disconnected
      });

      // Bind queue to exchange
      await this.channel.bindQueue(queueResult.queue, exchangeName, routingKey);

      // Subscribe to messages
      await this.channel.consume(queueResult.queue, async (msg) => {
        if (msg) {
          try {
            const messageContent = JSON.parse(msg.content.toString());
            this.logger.log(
              `Received message from exchange: ${exchangeName} with routing key: ${routingKey}`,
            );

            await callback(messageContent);

            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(
              `Error processing message from exchange ${exchangeName}:`,
              error,
            );
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.logger.log(
        `Subscribed to exchange: ${exchangeName} with routing key: ${routingKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Error subscribing to exchange ${exchangeName}:`,
        error,
      );
      throw error;
    }
  }
}
