import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({
    type: {
      userId: { type: String, required: true },
      username: { type: String, required: true },
      email: { type: String, required: true },
      homepage: { type: String, required: false },
    },
    required: true,
  })
  author: {
    userId: string;
    username: string;
    email: string;
    homepage?: string;
  };

  @Prop({
    type: {
      data: { type: String, required: false },
      filename: { type: String, required: false },
      mimeType: { type: String, required: false },
      originalName: { type: String, required: false },
      size: { type: Number, required: false },
    },
    required: false,
  })
  attachment?: {
    data: string;
    filename: string;
    mimeType: string;
    originalName: string;
    size: number;
  };

  @Prop({ required: true })
  postId: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', required: false })
  parentId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }], default: [] })
  replies: Types.ObjectId[];

  @Prop({ default: 0 })
  votes: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Add indexes for better performance
CommentSchema.index({ postId: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ createdAt: -1 });
