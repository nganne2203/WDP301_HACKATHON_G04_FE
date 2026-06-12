import type { Pagination as PaginationMeta } from '@/shared/api/types';
import { Button } from '@/shared/ui/button';

interface ListPaginationProps {
  page: number;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
}

export function ListPagination({ page, pagination, onPageChange }: ListPaginationProps) {
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.currentPage || page;

  if (totalPages <= 1 && !pagination) return null;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        {(pagination?.totalItems ?? 0).toLocaleString()} total · page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
