// src/components/AuthorCard.tsx
// Byline block under the article headline — the publishing admin's
// avatarUrl (Admin Accounts → profile picture) when set, else an
// initial circle + name + published time-ago.
//
// There's no "Follow this reporter" button here on purpose: the backend's
// live Article model only stores byline as a plain string (see
// backend/prisma/schema.prisma's Article.byline) — the Reporter/News
// models with real accounts are explicitly marked "Legacy / Phase 2, not
// used in Phase 1 APIs" in the schema. A Follow button needs a real
// reporter account + a followers table + website user accounts (the site
// has no auth of its own today) — none of that exists yet, so a Follow
// button here would just be a button that does nothing when tapped.

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'இப்போது';
  if (mins < 60) return `${mins} நிமிடம் முன்`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} மணி நேரம் முன்`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} நாட்கள் முன்`;
  return new Date(iso).toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AuthorCard({
  byline,
  publishedAt,
  avatarUrl,
}: {
  byline?: string | null;
  publishedAt: string | null;
  avatarUrl?: string | null;
}) {
  if (!byline && !publishedAt) return null;

  const initial = (byline?.trim()?.[0] ?? 'அ').toUpperCase();

  return (
    <div className="mt-4 flex items-center gap-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red/10 font-tamil text-base font-extrabold text-brand-red">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        {byline && <p className="truncate text-sm font-semibold text-black/80">{byline}</p>}
        <p className="text-xs text-black/45">
          {byline && <span className="font-tamil">நிருபர்</span>}
          {byline && publishedAt && <span> · </span>}
          {publishedAt && timeAgo(publishedAt)}
        </p>
      </div>
    </div>
  );
}
