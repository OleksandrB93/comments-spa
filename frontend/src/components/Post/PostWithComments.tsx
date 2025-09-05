import React, { useState } from "react";
import type { Post as PostType, Comment as CommentType } from "@/types";
import Post from "./Post";
import CommentForm from "../Comment/CommentForm";
import CommentsTable from "../Comment/CommentsTable";
import { z } from "zod";
import { CREATE_COMMENT, CREATE_REPLY } from "@/graphql/mutations";
import { GET_COMMENTS } from "@/graphql/queries";
import { useMutation, useQuery } from "@apollo/client/react";
import type {
  CreateCommentResponse,
  CreateReplyResponse,
  GetCommentsResponse,
} from "@/graphql/types";
import type { formSchema } from "@/utils/utils";

interface PostWithCommentsProps {
  post: PostType;
}

const PostWithComments: React.FC<PostWithCommentsProps> = ({ post }) => {
  const [currentPost, setCurrentPost] = useState<PostType>(post);

  // GraphQL queries and mutations
  const {
    data: commentsData,
    loading: loadingComments,
    refetch: refetchComments,
  } = useQuery<GetCommentsResponse>(GET_COMMENTS, {
    variables: { postId: post.id },
    errorPolicy: "all",
  });

  const [createComment, { loading: creatingComment }] =
    useMutation<CreateCommentResponse>(CREATE_COMMENT);
  const [createReply, { loading: creatingReply }] =
    useMutation<CreateReplyResponse>(CREATE_REPLY);

  // Recursive function to build nested comment structure
  const buildNestedComments = (
    parentId: string | null,
    allComments: any[]
  ): CommentType[] => {
    return allComments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => {
        const replies = buildNestedComments(comment.id, allComments);

        return {
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.author.id,
            username: comment.author.username,
            email: comment.author.email,
            homepage: comment.author.homepage,
          },
          createdAt: comment.createdAt,
          votes: 0, // Default votes for now
          replies: replies,
        };
      });
  };

  // Use comments from GraphQL query or fallback to post.comments
  const comments: CommentType[] = (() => {
    if (!commentsData?.comments) {
      return post.comments || [];
    }

    // Group comments properly - GraphQL returns all comments as separate elements
    // We need to group replies under their parent comments recursively
    const allComments = commentsData.comments;

    // Build nested structure starting from top-level comments (parentId = null)
    const nestedComments = buildNestedComments(null, allComments);

    return nestedComments;
  })();

  // Get only top-level comments for table display
  const topLevelComments = comments.filter((comment) => !comment.parentId);

  const handlePostVote = (_postId: string, type: "upvote" | "downvote") => {
    setCurrentPost((prev) => ({
      ...prev,
      votes: type === "upvote" ? prev.votes + 1 : prev.votes - 1,
    }));
  };

  const handleCommentVote = async (
    _commentId: string,
    _type: "upvote" | "downvote"
  ) => {
    // For now, just refetch comments to get updated vote counts
    // In the future, you might want to implement a vote mutation
    await refetchComments();
  };

  const handleAddComment = async (values: z.infer<typeof formSchema>) => {
    try {
      await createComment({
        variables: {
          input: {
            postId: post.id,
            content: values.text,
            author: {
              username: values.username,
              email: values.email,
              homepage: values.homepage || undefined,
            },
          },
        },
      });

      await refetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleReplyToComment = async (
    parentId: string,
    content: string,
    author: { username: string; email: string; homepage?: string }
  ) => {
    try {
      await createReply({
        variables: {
          input: {
            postId: post.id,
            parentId: parentId,
            content: content,
            author: {
              username: author.username,
              email: author.email,
              homepage: author.homepage,
            },
          },
        },
      });

      await refetchComments();
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Post */}
      <Post post={currentPost} onVote={handlePostVote} />

      {/* Comments section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comments ({loadingComments ? "..." : topLevelComments.length})
        </h3>

        {/* Add new comment form */}
        <CommentForm onSubmit={handleAddComment} isLoading={creatingComment} />

        {/* Comments table */}
        {loadingComments ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Loading comments...
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <CommentsTable
            comments={topLevelComments}
            onVote={handleCommentVote}
            onReply={handleReplyToComment}
            isCreatingReply={creatingReply}
          />
        )}
      </div>
    </div>
  );
};

export default PostWithComments;
