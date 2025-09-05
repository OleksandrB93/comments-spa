import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Hash,
  Link,
  Clock,
  Info,
  Reply,
} from "lucide-react";
import type { Comment as CommentType } from "@/types";
import { Button } from "@/components/ui/button";
import CommentForm from "./CommentForm";

interface CommentProps {
  comment: CommentType;
  onVote: (commentId: string, type: "upvote" | "downvote") => void;
  onReply: (
    parentId: string,
    content: string,
    author: { username: string; email: string; homepage?: string }
  ) => void;
  depth?: number;
  isCreatingReply?: boolean;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onVote,
  onReply,
  depth = 0,
  isCreatingReply = false,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReply = (values: any) => {
    onReply(comment.id, values.text, {
      username: values.username,
      email: values.email,
      homepage: values.homepage,
    });
    setShowReplyForm(false);
  };

  return (
    <div
      className={`${"ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4"}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.author.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                comment.author.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Username and timestamp */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {comment.author.username}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Hash className="w-4 h-4" />
              <Link className="w-4 h-4" />
              <Clock className="w-4 h-4" />
              <Info className="w-4 h-4" />
            </div>

            {/* Voting */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onVote(comment.id, "upvote")}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[20px] text-center">
                {comment.votes}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onVote(comment.id, "downvote")}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quoted content (if exists) */}
        {comment.quotedContent && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              {comment.quotedContent}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="text-gray-900 dark:text-white leading-relaxed mb-3">
          {comment.content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-2 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Reply button */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
          >
            <Reply className="w-4 h-4 mr-1" />
            Reply
          </Button>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <CommentForm
            onSubmit={handleReply}
            placeholder="Write your reply..."
            buttonText="Reply"
            isLoading={isCreatingReply}
          />
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
              isCreatingReply={isCreatingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
