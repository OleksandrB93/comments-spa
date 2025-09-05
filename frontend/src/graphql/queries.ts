import { gql } from "@apollo/client";

export const GET_COMMENTS = gql`
  query GetComments($postId: String!) {
    comments(postId: $postId) {
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
      replies {
        id
        content
        author {
          id
          username
          email
          homepage
        }
        createdAt
      }
    }
  }
`;
