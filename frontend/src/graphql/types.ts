export interface CommentAttachmentInput {
  data: string;
  filename: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export type CreateCommentInput = {
  postId: string;
  content: string;
  username: string;
  email: string;
  homepage?: string;
  attachment?: CommentAttachmentInput;
};

export type CreateReplyInput = {
  postId: string;
  parentId: string;
  content: string;
  username: string;
  email: string;
  homepage?: string;
  attachment?: CommentAttachmentInput;
};

export interface CommentAttachment {
  data: string;
  filename: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export interface CommentAuthor {
  id: string;
  username: string;
  email: string;
  homepage?: string;
}

export interface GraphQLComment {
  id: string;
  content: string;
  author: CommentAuthor;
  attachment?: CommentAttachment;
  createdAt: string;
  parentId?: string;
  postId: string;
  replies?: GraphQLComment[];
}

export interface CreateCommentResponse {
  createComment: GraphQLComment;
}

export interface CreateReplyResponse {
  createReply: GraphQLComment;
}

export interface GetCommentsResponse {
  comments: GraphQLComment[];
}

export interface CommentsPaginatedResponse {
  commentsPaginated: {
    comments: GraphQLComment[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
