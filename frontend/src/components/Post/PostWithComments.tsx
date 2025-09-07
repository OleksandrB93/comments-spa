import React, { useState } from "react";
import type { Post as PostType } from "@/types";
import Post from "./Post";
import CommentForm from "../Comment/CommentForm";
import CommentsTable from "../Comment/CommentsTable";
import { z } from "zod";
import { CREATE_COMMENT, CREATE_REPLY } from "@/graphql/mutations";
import { useMutation } from "@apollo/client/react";
import type {
  CreateCommentResponse,
  CreateReplyResponse,
} from "@/graphql/types";
import type { formSchema } from "@/utils/utils";

interface PostWithCommentsProps {
  post: PostType;
}

const PostWithComments: React.FC<PostWithCommentsProps> = ({ post }) => {
  const [currentPost, setCurrentPost] = useState<PostType>(post);

  // GraphQL mutations
  // Note: CommentsTable now handles its own data fetching

  const [createComment, { loading: creatingComment }] =
    useMutation<CreateCommentResponse>(CREATE_COMMENT);
  const [createReply, { loading: creatingReply }] =
    useMutation<CreateReplyResponse>(CREATE_REPLY);

  // For backward compatibility, we'll keep the old logic but it's not used anymore
  // since CommentsTable now handles its own data fetching

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
    // Note: CommentsTable will handle its own data refetching
  };

  const handleAddComment = async (values: z.infer<typeof formSchema>) => {
    try {
      await createComment({
        variables: {
          input: {
            postId: post.id,
            content: values.text,
            userId: "123", // TODO: replace with dynamic user id
            username: values.username,
            email: values.email,
            homepage: values.homepage || undefined,
          },
        },
      });

      // Note: CommentsTable will automatically refetch its data
      // No need to manually refetch since it uses useQuery
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
            userId: "123", // TODO: replace with dynamic user id
            username: author.username,
            email: author.email,
            homepage: author.homepage,
          },
        },
      });

      // Note: CommentsTable will automatically refetch its data
      // No need to manually refetch since it uses useQuery
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
          Comments
        </h3>

        {/* Add new comment form */}
        <CommentForm onSubmit={handleAddComment} isLoading={creatingComment} />

        {/* Comments table */}
        <CommentsTable
          postId={post.id}
          onVote={handleCommentVote}
          onReply={handleReplyToComment}
          isCreatingReply={creatingReply}
        />
      </div>
    </div>
  );
};

export default PostWithComments;
