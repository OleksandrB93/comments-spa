import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CommentAttachmentInput {
  @Field()
  data: string;

  @Field()
  filename: string;

  @Field()
  mimeType: string;

  @Field()
  originalName: string;

  @Field(() => Int)
  size: number;
}

@InputType()
export class CommentAuthorInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  homepage?: string;
}

@InputType()
export class CreateCommentInput {
  @Field()
  postId: string;

  @Field()
  content: string;

  @Field()
  userId: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  homepage?: string;

  @Field(() => CommentAttachmentInput, { nullable: true })
  attachment?: CommentAttachmentInput;
}

@InputType()
export class CreateReplyInput {
  @Field()
  postId: string;

  @Field()
  parentId: string;

  @Field()
  content: string;

  @Field()
  userId: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  homepage?: string;

  @Field(() => CommentAttachmentInput, { nullable: true })
  attachment?: CommentAttachmentInput;
}
