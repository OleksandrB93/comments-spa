import React from "react";
import { ChevronUp, ChevronDown, Hash, Link, Clock, Info } from "lucide-react";
import type { Post as PostType } from "@/types";
import { Button } from "@/components/ui/button";

interface PostProps {
  post: PostType;
  onVote: (postId: string, type: "upvote" | "downvote") => void;
}

const Post: React.FC<PostProps> = ({ post, onVote }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              post.author.username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Username and timestamp */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {post.author.username}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
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
              onClick={() => onVote(post.id, "upvote")}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[20px] text-center">
              {post.votes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onVote(post.id, "downvote")}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-900 dark:text-white leading-relaxed">
        {post.content.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}

        {/* Random image */}
        <div className="mt-4">
          <img
            src={`https://picsum.photos/800/400?random=${post.id}`}
            alt="Random image"
            className="w-full h-64 object-cover rounded-lg shadow-md"
            onError={(e) => {
              // Fallback to a different random image if the first one fails
              const target = e.target as HTMLImageElement;
              target.src = `https://picsum.photos/800/400?random=${Date.now()}`;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Post;
