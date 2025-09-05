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

export const GET_COMMENTS_PAGINATED = gql`
  query GetCommentsPaginated($postId: String!, $page: Int!, $limit: Int!) {
    commentsPaginated(postId: $postId, page: $page, limit: $limit) {
      comments {
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
      totalCount
      page
      limit
      totalPages
    }
  }
`;
