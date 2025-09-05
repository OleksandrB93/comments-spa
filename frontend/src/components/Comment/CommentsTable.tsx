import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// import type { Comment as CommentType } from "@/types"; // Not used anymore
import Comment from "./Comment";
import { Button } from "@/components/ui/button";
import { GET_COMMENTS_PAGINATED } from "@/graphql/queries";
import { useQuery } from "@apollo/client/react";
import type { CommentsPaginatedResponse } from "@/graphql/types";

interface CommentsTableProps {
  postId: string;
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
  postId,
  onVote,
  onReply,
  isCreatingReply = false,
}) => {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 25;

  // Fetch paginated comments from backend
  const { data: paginatedData, loading } = useQuery<CommentsPaginatedResponse>(
    GET_COMMENTS_PAGINATED,
    {
      variables: {
        postId,
        page: currentPage,
        limit: commentsPerPage,
      },
      errorPolicy: "all",
    }
  );

  const comments = paginatedData?.commentsPaginated?.comments || [];
  const totalCount = paginatedData?.commentsPaginated?.totalCount || 0;
  const totalPages = paginatedData?.commentsPaginated?.totalPages || 0;

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

  // Sort comments (backend already provides paginated data)
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

  // Reset to first page when sorting changes
  const handleSortWithReset = (field: SortField) => {
    handleSort(field);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Helper function to add votes to comments and their replies
  const addVotesToComment = (comment: any): any => ({
    ...comment,
    votes: 0,
    replies: comment.replies?.map(addVotesToComment) || [],
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
              onClick={() => handleSortWithReset("username")}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>User Name</span>
              {getSortIcon("username")}
            </button>
          </div>
          <div className="col-span-3">
            <button
              onClick={() => handleSortWithReset("email")}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>E-mail</span>
              {getSortIcon("email")}
            </button>
          </div>
          <div className="col-span-4">Content</div>
          <div className="col-span-1">
            <button
              onClick={() => handleSortWithReset("createdAt")}
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
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading comments...
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments found.
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="p-6">
              <Comment
                comment={addVotesToComment(comment)}
                onVote={onVote}
                onReply={onReply}
                isCreatingReply={isCreatingReply}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(currentPage - 1) * commentsPerPage + 1} to{" "}
              {Math.min(currentPage * commentsPerPage, totalCount)} of{" "}
              {totalCount} comments
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handlePageChange(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsTable;
