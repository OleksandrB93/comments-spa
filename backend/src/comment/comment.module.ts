import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { CommentGateway } from './comment.gateway';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { RabbitMQService } from '../rabbit/rabbitmq.service';
import { CommentWorker } from './comment.worker';
import { RabbitMQTestService } from '../rabbit/rabbitmq-test.service';
import { AnalyticsResolver } from './analytics.resolver';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    CommonModule,
  ],
  providers: [
    CommentService,
    CommentResolver,
    CommentGateway,
    RabbitMQService,
    CommentWorker,
    RabbitMQTestService,
    AnalyticsResolver,
  ],
  exports: [CommentService, CommentGateway, RabbitMQService],
})
export class CommentModule {}
