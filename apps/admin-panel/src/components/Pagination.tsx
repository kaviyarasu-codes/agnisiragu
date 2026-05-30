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
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{showing}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
