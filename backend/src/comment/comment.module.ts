import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { CommentGateway } from './comment.gateway';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  providers: [CommentService, CommentResolver, CommentGateway],
  exports: [CommentService, CommentGateway],
})
export class CommentModule {}
