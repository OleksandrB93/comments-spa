import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Comment as CommentType } from "@/types";
import Comment from "./Comment";

interface CommentsTableProps {
  comments: CommentType[];
  onVote: (commentId: string, type: "upvote" | "downvote") => void;
  onReply: (
    parentId: string,
    content: string,
    author: { username: string; email: string; homepage?: string }
  ) => void;
  isCreatingReply?: boolean;
}

type SortField = "username" | "email" | "createdAt";
type SortDirection = "asc" | "desc";

const CommentsTable: React.FC<CommentsTableProps> = ({
  comments,
  onVote,
  onReply,
  isCreatingReply = false,
}) => {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it and start with desc (most recent first)
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "username":
        aValue = a.author.username.toLowerCase();
        bValue = b.author.username.toLowerCase();
        break;
      case "email":
        aValue = (a.author.email || "").toLowerCase();
        bValue = (b.author.email || "").toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-1"></div> {/* Avatar column */}
          <div className="col-span-3">
            <button
              onClick={() => handleSort("username")}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>User Name</span>
              {getSortIcon("username")}
            </button>
          </div>
          <div className="col-span-3">
            <button
              onClick={() => handleSort("email")}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>E-mail</span>
              {getSortIcon("email")}
            </button>
          </div>
          <div className="col-span-4">Content</div>
          <div className="col-span-1">
            <button
              onClick={() => handleSort("createdAt")}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>Date</span>
              {getSortIcon("createdAt")}
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-600">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="p-6">
            <Comment
              comment={comment}
              onVote={onVote}
              onReply={onReply}
              isCreatingReply={isCreatingReply}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsTable;
