import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

// Zero-based `page`; renders nothing when there is a single page.
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        Page <span className="font-medium text-foreground">{page + 1}</span> of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Next page">
        <span className="hidden sm:inline">Next</span>
        <ChevronRight />
      </Button>
    </nav>
  );
}
