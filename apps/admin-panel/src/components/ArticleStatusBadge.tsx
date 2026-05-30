// src/components/ArticleStatusBadge.tsx
import type { ArticleStatus } from '../types';

const STATUS_CONFIG: Record<ArticleStatus, { label: string; cls: string }> = {
  DRAFT:       { label: 'Draft',       cls: 'badge-gray' },
  REVIEW:      { label: 'Review',      cls: 'badge-yellow' },
  PUBLISHED:   { label: 'Published',   cls: 'badge-green' },
  UNPUBLISHED: { label: 'Unpublished', cls: 'badge-orange' },
  DELETED:     { label: 'Deleted',     cls: 'badge-red' },
};

export default function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const { label, cls } = STATUS_CONFIG[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
}
