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
import type { Comment as CommentType, Attachment } from "@/types";
import { Button } from "@/components/ui/button";
import CommentForm from "./CommentForm";
import { formSchema } from "@/utils/utils";
import { z } from "zod";
import { readFileAsBase64, resizeImage } from "@/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { DialogDescription } from "@radix-ui/react-dialog";

interface CommentProps {
  comment: CommentType;
  onVote: (commentId: string, type: "upvote" | "downvote") => void;
  onReply: (
    parentId: string,
    content: string,
    author: { username: string; email: string; homepage?: string },
    attachment?: Attachment
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

  const handleReply = async (values: z.infer<typeof formSchema>) => {
    let attachment;
    if (values.file && values.file.length > 0) {
      let file = values.file[0];

      if (file.type.startsWith("image/")) {
        try {
          file = await resizeImage(file, 320, 240);
        } catch (error) {
          console.error("Error resizing image:", error);
          return;
        }
      }

      const base64Data = await readFileAsBase64(file);
      attachment = {
        data: base64Data,
        filename: file.name,
        mimeType: file.type,
        originalName: file.name,
        size: file.size,
      };
    }

    onReply(
      comment.id,
      values.text,
      {
        username: values.username,
        email: values.email,
        homepage: values.homepage,
      },
      attachment
    );
    setShowReplyForm(false);
  };

  return (
    <div className={`${depth > 0 ? "ml-6" : ""}`}>
      <div
        className={`group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/50 ${
          depth > 0
            ? "border-l-4 border-l-primary dark:border-l-primary/80"
            : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white dark:ring-gray-800">
                {comment.author.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>

            {/* Username and timestamp */}
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {comment.author.username}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Hash className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Link className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Voting */}
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-all duration-200"
                onClick={() => onVote(comment.id, "upvote")}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[24px] text-center px-1">
                {comment.votes}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                onClick={() => onVote(comment.id, "downvote")}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quoted content (if exists) */}
        {comment.quotedContent && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border-l-4 border-primary dark:border-primary/80">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
              "{comment.quotedContent}"
            </p>
          </div>
        )}

        {/* Content */}
        <div className="text-gray-900 dark:text-white leading-relaxed mb-4 text-base prose prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-bold mb-2 text-gray-900 dark:text-white">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-xs font-bold mb-1 text-gray-900 dark:text-white">
                  {children}
                </h6>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 text-gray-900 dark:text-white">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-3 text-gray-900 dark:text-white">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-3 text-gray-900 dark:text-white">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="mb-1 text-gray-900 dark:text-white">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic mb-3 text-gray-700 dark:text-gray-300">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className="my-4 border-gray-300 dark:border-gray-600" />
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-gray-900 dark:text-white">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-900 dark:text-white">
                  {children}
                </em>
              ),
              u: ({ children }) => (
                <u className="underline text-gray-900 dark:text-white">
                  {children}
                </u>
              ),
            }}
          >
            {comment.content}
          </ReactMarkdown>
        </div>

        {/* Attachment */}
        {comment.attachment && (
          <div className="mb-4 w-30">
            {comment.attachment.mimeType.startsWith("image/") ? (
              <Dialog>
                <DialogTrigger className="cursor-pointer hover:scale-105 transition-all duration-300">
                  <img
                    src={`data:${comment.attachment.mimeType};base64,${comment.attachment.data}`}
                    alt={comment.attachment.filename}
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-full h-auto">
                  <DialogTitle className="sr-only">
                    {comment.attachment.filename}
                  </DialogTitle>
                  <img
                    src={`data:${comment.attachment.mimeType};base64,${comment.attachment.data}`}
                    alt={comment.attachment.filename}
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </DialogContent>
                <DialogDescription className="sr-only">
                  {comment.attachment.filename}
                </DialogDescription>
              </Dialog>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <a
                  href={`data:${comment.attachment.mimeType};base64,${comment.attachment.data}`}
                  download={comment.attachment.filename}
                  className="text-primary hover:underline"
                >
                  Download {comment.attachment.filename}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Reply button */}
        <div className="flex items-center justify-between cursor-pointer">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="group/reply relative inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary via-primary/80 to-primary/60 hover:from-primary hover:via-primary/90 hover:to-primary/70 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 dark:shadow-primary/25 overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 opacity-0 group-hover/reply:opacity-100 transition-opacity duration-300 cursor-pointer"></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover/reply:translate-x-full transition-transform duration-700"></div>

            {/* Content */}
            <div className="relative flex items-center cursor-pointer">
              <Reply className="w-4 h-4 mr-2 group-hover/reply:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Reply</span>
              {showReplyForm && (
                <span className="ml-2 relative z-10 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/30">
                  Active
                </span>
              )}
            </div>

            {/* Pulse effect when active */}
            {showReplyForm && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-primary/80 to-primary/60 animate-pulse opacity-20"></div>
            )}
          </Button>

          {/* Comment ID badge
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
            #{comment.id.slice(-6)}
          </div> */}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/5 dark:from-primary/20 dark:via-primary/10 dark:to-primary/10 rounded-xl border border-primary/30 dark:border-primary/30 shadow-sm backdrop-blur-sm cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Writing a reply...
              </span>
            </div>
            <CommentForm
              onSubmit={handleReply}
              buttonText="Post Reply"
              isLoading={isCreatingReply}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
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
