import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { CommentGateway } from './comment.gateway';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { RabbitMQService } from './rabbitmq.service';
import { CommentWorker } from './comment.worker';
import { RabbitMQTestService } from './rabbitmq-test.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  providers: [
    CommentService,
    CommentResolver,
    CommentGateway,
    RabbitMQService,
    CommentWorker,
    RabbitMQTestService,
  ],
  exports: [CommentService, CommentGateway, RabbitMQService],
})
export class CommentModule {}
