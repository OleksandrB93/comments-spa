import { gql } from "@apollo/client";

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      author {
        userId
        username
        email
        homepage
      }
      attachment {
        filename
        mimeType
      }
      createdAt
    }
  }
`;

export const CREATE_REPLY = gql`
  mutation CreateReply($input: CreateReplyInput!) {
    createReply(input: $input) {
      id
      content
      author {
        userId
        username
        email
        homepage
      }
      attachment {
        filename
        mimeType
      }
      createdAt
      parentId
      postId
    }
  }
`;
