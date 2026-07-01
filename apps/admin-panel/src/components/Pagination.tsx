// src/components/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number;
  showing: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
}

export default function Pagination({ total, showing, hasMore, onPrev, onNext, hasPrev }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-text-muted">
        Showing <span className="font-semibold text-text-secondary">{showing}</span> of{' '}
        <span className="font-semibold text-text-secondary">{total}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
