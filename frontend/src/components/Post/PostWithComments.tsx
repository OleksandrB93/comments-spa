import React, { useState } from "react";
import type { Post as PostType, Comment as CommentType, User } from "@/types";
import Post from "./Post";
import Comment from "../Comment/Comment";
import CommentForm from "../Comment/CommentForm";
import { z } from "zod";
import { CREATE_COMMENT, CREATE_REPLY } from "@/graphql/mutations";
import { useMutation } from "@apollo/client/react";
import type { CreateCommentInput, CreateReplyInput } from "@/graphql/types";

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
});

interface PostWithCommentsProps {
  post: PostType;
}

const PostWithComments: React.FC<PostWithCommentsProps> = ({ post }) => {
  const [currentPost, setCurrentPost] = useState<PostType>(post);
  const [comments, setComments] = useState<CommentType[]>(post.comments || []);

  // GraphQL mutations
  const [createComment, { loading: creatingComment }] =
    useMutation(CREATE_COMMENT);
  const [createReply, { loading: creatingReply }] = useMutation(CREATE_REPLY);

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

  const handleCommentVote = (
    commentId: string,
    type: "upvote" | "downvote"
  ) => {
    const updateVotes = (comments: CommentType[]): CommentType[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            votes: type === "upvote" ? comment.votes + 1 : comment.votes - 1,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateVotes(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(updateVotes(comments));
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

      // For now, just log to console as requested
      // In the future, you can update the local state with the new comment
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

      // For now, just log to console as requested
      // In the future, you can update the local state with the new reply
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
          Comments ({comments.length})
        </h3>

        {/* Add new comment form */}
        <CommentForm onSubmit={handleAddComment} />

        {/* Comments list */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onVote={handleCommentVote}
              onReply={handleReplyToComment}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostWithComments;
