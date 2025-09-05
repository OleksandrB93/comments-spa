import { gql } from "@apollo/client";

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      author {
        id
        username
        email
        homepage
      }
      createdAt
      parentId
      postId
    }
  }
`;

export const CREATE_REPLY = gql`
  mutation CreateReply($input: CreateReplyInput!) {
    createReply(input: $input) {
      id
      content
      author {
        id
        username
        email
        homepage
      }
      createdAt
      parentId
      postId
    }
  }
`;
