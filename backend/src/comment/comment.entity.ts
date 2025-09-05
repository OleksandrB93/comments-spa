import { ObjectType, Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CommentAuthorInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  homepage?: string;
}

@ObjectType()
export class CommentAuthor {
  @Field(() => ID)
  id: string;

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

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  postId: string;

  @Field(() => [Comment], { nullable: true })
  replies?: Comment[];
}

@InputType()
export class CreateCommentInput {
  @Field()
  postId: string;

  @Field()
  content: string;

  @Field(() => CommentAuthorInput)
  author: CommentAuthorInput;
}

@InputType()
export class CreateReplyInput {
  @Field()
  postId: string;

  @Field()
  parentId: string;

  @Field()
  content: string;

  @Field(() => CommentAuthorInput)
  author: CommentAuthorInput;
}

@ObjectType()
export class CommentsResponse {
  @Field(() => [Comment])
  comments: Comment[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
