import React, { useState } from "react";
import type { Post as PostType, Comment as CommentType } from "@/types";
import Post from "./Post";
import Comment from "../Comment/Comment";
import CommentForm from "../Comment/CommentForm";
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
    error: commentsError,
  } = useQuery<GetCommentsResponse>(GET_COMMENTS, {
    variables: { postId: post.id },
    errorPolicy: "all",
  });

  console.log("PostWithComments - commentsError:", commentsError);

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

  const handlePostVote = (postId: string, type: "upvote" | "downvote") => {
    console.log(postId);

    setCurrentPost((prev) => ({
      ...prev,
      votes: type === "upvote" ? prev.votes + 1 : prev.votes - 1,
    }));
  };

  const handleCommentVote = async (
    commentId: string,
    type: "upvote" | "downvote"
  ) => {
    // For now, just refetch comments to get updated vote counts
    // In the future, you might want to implement a vote mutation
    console.log(`Voting ${type} on comment ${commentId}`);
    await refetchComments();
  };

  const handleAddComment = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await createComment({
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
      const result = await createReply({
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
          Comments ({loadingComments ? "..." : comments.length})
        </h3>

        {/* Add new comment form */}
        <CommentForm onSubmit={handleAddComment} isLoading={creatingComment} />

        {/* Comments list */}
        <div className="space-y-4">
          {loadingComments ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onVote={handleCommentVote}
                onReply={(parentId, content, author) =>
                  handleReplyToComment(parentId, content, author)
                }
                isCreatingReply={creatingReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostWithComments;
