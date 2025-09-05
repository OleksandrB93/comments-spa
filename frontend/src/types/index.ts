export interface User {
  id: string;
  username: string;
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
  author: User;
  createdAt: string;
  votes: number;
  parentId?: string; // for nested comments
  replies?: Comment[];
  quotedContent?: string; // for quoting the parent comment
}

export interface VoteAction {
  type: "upvote" | "downvote";
  targetId: string;
  targetType: "post" | "comment";
}
