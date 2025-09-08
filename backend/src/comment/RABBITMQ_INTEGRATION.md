# RabbitMQ Integration in Comment Module

## Overview

This document describes the RabbitMQ integration in the comment module for asynchronous message processing.

## Architecture

```
Frontend (React)
    ↓ GraphQL/WebSocket
Backend (NestJS)
    ↓ AMQP (RabbitMQ)
RabbitMQ Message Broker
    ↓ Messages
Background Workers (NestJS)
    ↓ Results
Database/Storage
```

## Components

### 1. RabbitMQService

- **File**: `rabbitmq.service.ts`
- **Purpose**: Main service for working with RabbitMQ
- **Functions**:
  - Connection to RabbitMQ
  - Publishing messages to queues
  - Subscribing to queues
  - Working with exchanges

### 2. CommentWorker

- **File**: `comment.worker.ts`
- **Purpose**: Worker for processing messages from RabbitMQ
- **Functions**:
  - Processing created comments
  - File processing
  - Sending email notifications
  - WebSocket broadcast

### 3. CommentService (updated)

- **File**: `comment.service.ts`
- **Changes**: Added publishing messages to RabbitMQ when creating comments

## Queues and Exchanges

### Queues

- `comment.created` - creation of new comments
- `file.processing` - file processing
- `email.notification` - email notifications

### Exchanges

- `comment.events` - comment event broadcasting

## Usage Examples

### 1. Creating a Comment

```typescript
// CommentService automatically sends messages to RabbitMQ
const comment = await this.commentService.createComment({
  postId: 'post-123',
  content: 'Hello world!',
  userId: 'user-456',
  username: 'John Doe',
  email: 'john@example.com',
  attachment: {
    data: 'base64-data',
    filename: 'image.jpg',
    mimeType: 'image/jpeg',
    originalName: 'image.jpg',
    size: 1024,
  },
});
```

### 2. Processing Messages in Worker

```typescript
// CommentWorker automatically processes messages
@RabbitSubscribe('comment.created')
async handleCommentCreated(message: CommentCreatedMessage) {
  // 1. File processing (if exists)
  if (message.attachment) {
    await this.processFile(message.attachment);
  }

  // 2. Sending email notification
  if (message.parentId) {
    await this.sendEmailNotification(message);
  }

  // 3. WebSocket broadcast
  await this.broadcastToWebSocket(message);
}
```

### 3. Testing RabbitMQ

```graphql
# GraphQL mutation for testing
mutation {
  testRabbitMQ
}
```

## Configuration

### Environment Variables

```env
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672
```

### Docker Compose

```yaml
rabbitmq:
  image: rabbitmq:3.12-management
  ports:
    - '5672:5672' # AMQP
    - '15672:15672' # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: rabbit123
```

## Integration Benefits

### 1. Asynchronous Processing

- Files are processed in the background
- Faster response to users
- Less load on the main thread

### 2. Reliability

- Messages are stored on disk
- Automatic recovery from failures
- Dead letter queues for errors

### 3. Scalability

- Multiple workers can process messages
- Distributed load
- Horizontal scaling

### 4. Separation of Concerns

- CommentService - main logic
- CommentWorker - background tasks
- RabbitMQ - message delivery

## Monitoring

### RabbitMQ Management UI

- URL: http://localhost:15672
- Login: admin / rabbit123
- Monitoring queues, exchanges, connections

### Logs

```typescript
// All operations are logged
this.logger.log('Message published to queue: comment.created');
this.logger.log('Processing comment created: comment-123');
```

## Extensions

### Adding New Queues

```typescript
// In CommentWorker
await this.rabbitMQService.subscribe('new.queue', this.handleNewMessage.bind(this));

private async handleNewMessage(message: any) {
  // Processing new message type
}
```

### Adding New Exchanges

```typescript
// Publishing to new exchange
await this.rabbitMQService.publishToExchange(
  'new.exchange',
  'routing.key',
  data,
);

// Subscribing to new exchange
await this.rabbitMQService.subscribeToExchange(
  'new.exchange',
  'routing.key',
  callback,
);
```

## Troubleshooting

### Connection Issues

1. Check that RabbitMQ is running
2. Check connection URL
3. Check credentials

### Messages Not Being Processed

1. Check worker logs
2. Check queues in Management UI
3. Check subscription correctness

### High Load

1. Add more workers
2. Configure prefetch count
3. Use multiple queues
