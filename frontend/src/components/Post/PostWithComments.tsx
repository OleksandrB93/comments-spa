import React, { useState } from "react";
import type { Post as PostType, Comment as CommentType, User } from "@/types";
import Post from "./Post";
import Comment from "../Comment/Comment";
import CommentForm from "../Comment/CommentForm";
import { z } from "zod";
import { CREATE_COMMENT, CREATE_REPLY } from "@/graphql/mutations";
import { GET_COMMENTS } from "@/graphql/queries";
import { useMutation, useQuery } from "@apollo/client/react";
import type {
  CreateCommentInput,
  CreateReplyInput,
  CreateCommentResponse,
  CreateReplyResponse,
  GetCommentsResponse,
} from "@/graphql/types";

export const formSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9]+$/, { message: "Only Latin letters and numbers" }),
  email: z.email({ message: "Invalid email address" }),
  homepage: z
    .string()
    .refine((val) => val === "" || z.url().safeParse(val).success, {
      message: "Invalid homepage URL",
    })
    .optional(),
  text: z.string().min(1).max(1000),
  captchaValid: z.boolean().refine((val) => val === true, {
    message: "Please complete the captcha",
  }),
  captchaText: z.string(),
});

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

  // Use comments from GraphQL query or fallback to post.comments
  const comments: CommentType[] =
    commentsData?.comments?.map((comment) => ({
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
      replies:
        comment.replies?.map((reply) => ({
          id: reply.id,
          content: reply.content,
          author: {
            id: reply.author.id,
            username: reply.author.username,
            email: reply.author.email,
            homepage: reply.author.homepage,
          },
          createdAt: reply.createdAt,
          votes: 0,
          replies: [],
        })) || [],
    })) ||
    post.comments ||
    [];

  // Mock user for demonstration
  const currentUser: User = {
    id: "current-user",
    username: "Current user",
  };

  const handlePostVote = (postId: string, type: "upvote" | "downvote") => {
    const id = postId;
    console.log(id);

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
      const input: CreateCommentInput = {
        postId: currentPost.id,
        content: values.text,
        author: {
          username: values.username,
          email: values.email,
          homepage: values.homepage || undefined,
        },
      };

      console.log("Sending comment to GraphQL:", input);

      const result = await createComment({
        variables: { input },
      });

      console.log("Comment created successfully:", result.data);

      // Refetch comments from database to get the latest data
      await refetchComments();
      console.log("Comments refetched from database");
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    try {
      const input: CreateReplyInput = {
        postId: currentPost.id,
        parentId,
        content,
        author: {
          username: currentUser.username,
          email: "user@example.com", // You might want to get this from context
          homepage: undefined,
        },
      };

      console.log("Sending reply to GraphQL:", input);

      const result = await createReply({
        variables: { input },
      });

      console.log("Reply created successfully:", result.data);

      // Refetch comments from database to get the latest data
      await refetchComments();
      console.log("Comments refetched from database after reply");
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
                onReply={handleReplyToComment}
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
