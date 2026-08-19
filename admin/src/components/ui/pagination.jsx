import React from "react";
import { Button } from "@/components/ui/button";

export default function Pagination({
  pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
  onPageChange = () => {},
  isLoading = false,
}) {
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      onPageChange(newPage);
    }
  };

  const generatePageNumbers = () => {
  const pages = [];
  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;

  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Near start
  if (currentPage <= 3) {
    pages.push(1, 2, 3);
    pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  // Near end
  if (currentPage >= totalPages - 2) {
    pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    return pages;
  }

  // Middle (REAL-TIME sliding)
  pages.push(currentPage, currentPage + 1, currentPage + 2);
  pages.push("...");
  pages.push(totalPages);

  return pages;
};


  if (!pagination || pagination.totalPages <= 0) return null;

  const start =
    pagination.total > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;

  const end = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="flex items-center justify-between mt-4 gap-4">
      <div className="text-sm text-gray-600">
        Showing {start} to {end} of {pagination.total} results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="!bg-white !text-primary !px-2"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1 || isLoading}
        >
          Prev
        </Button>

        {generatePageNumbers().map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-500"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant="default"
              size="sm"
              className={`!bg-white !text-primary ${
                pageNum === pagination.page
                  ? "!bg-primary !text-white !px-4"
                  : ""
              }`}
              onClick={() => handlePageChange(pageNum)}
              disabled={isLoading}
            >
              {pageNum}
            </Button>
          )
        )}

        <Button
          variant="default"
          size="sm"
          className="!bg-white !text-primary !px-2"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={
            pagination.page >= pagination.totalPages || isLoading
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
