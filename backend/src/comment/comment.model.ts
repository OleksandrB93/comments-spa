import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CommentAttachment {
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

@ObjectType()
export class CommentAuthor {
  @Field(() => ID)
  userId: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  homepage?: string;
}

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => CommentAuthor)
  author: CommentAuthor;

  @Field(() => CommentAttachment, { nullable: true })
  attachment?: CommentAttachment;

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  postId: string;

  @Field(() => [Comment], { nullable: true })
  replies?: Comment[];
}

@ObjectType()
export class CommentsResponse {
  @Field(() => [Comment])
  comments: Comment[];

  @Field(() => [Comment], { nullable: true })
  allComments?: Comment[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
