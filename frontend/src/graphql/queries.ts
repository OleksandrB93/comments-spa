import { gql } from "@apollo/client";

export const GET_COMMENTS = gql`
  query GetComments($postId: String!) {
    comments(postId: $postId) {
      id
      content
      author {
        userId
        username
        email
        homepage
      }
      attachment {
        data
        filename
        mimeType
        originalName
        size
      }
      createdAt
      parentId
      postId
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
          userId
          username
          email
          homepage
        }
        attachment {
          data
          filename
          mimeType
          originalName
          size
        }
        createdAt
        parentId
        postId
      }
      allComments {
        id
        content
        author {
          userId
          username
          email
          homepage
        }
        attachment {
          data
          filename
          mimeType
          originalName
          size
        }
        createdAt
        parentId
        postId
      }
      totalCount
      page
      limit
      totalPages
    }
  }
`;
