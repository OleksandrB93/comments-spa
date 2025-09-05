


export interface CreateCommentInput {
    postId: string;
    content: string;
    author: {
      username: string;
      email: string;
      homepage?: string;
    };
  }
  
  export interface CreateReplyInput {
    postId: string;
    parentId: string;
    content: string;
    author: {
      username: string;
      email: string;
      homepage?: string;
    };
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
    createdAt: string;
    parentId?: string;
    postId: string;
    replies?: GraphQLComment[];
  }