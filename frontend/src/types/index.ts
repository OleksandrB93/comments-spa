export interface User {
  id: string;
  username: string;
  email?: string;
  homepage?: string;
  avatar?: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  votes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: {
    userId: string;
    username: string;
    email: string;
    homepage?: string;
  };
  createdAt: string;
  votes?: number;
  parentId?: string;
  postId: string;
  replies?: Comment[];
  quotedContent?: string;
  attachment?: Attachment;
}

export interface Attachment {
  data: string;
  filename: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export interface VoteAction {
  type: "upvote" | "downvote";
  targetId: string;
  targetType: "post" | "comment";
}

export interface DeleteCommentInput {
  commentId: string;
  userId: string;
}
