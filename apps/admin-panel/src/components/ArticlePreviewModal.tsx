// src/components/ArticlePreviewModal.tsx
//
// Shows any admin roughly how an article will look in the reader app/
// website — for a DRAFT this is the only way to see it before it's public,
// since the website only ever serves PUBLISHED articles. Deliberately a
// self-contained render (not a live fetch from the website) so it works
// from unsaved form state too, and never has to expose draft content
// through a public URL.
import { useState } from 'react';
import { X, Radio, Newspaper } from 'lucide-react';

export interface PreviewArticleData {
  titleTa: string;
  titleEn?: string;
  bodyTa: string;
  bodyEn?: string;
  excerpt?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  byline?: string;
  categoryName?: string;
  isBreaking?: boolean;
  status?: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  UNPUBLISHED: 'bg-orange-100 text-orange-700',
  DELETED: 'bg-red-100 text-red-700',
};

export default function ArticlePreviewModal({ article, onClose }: { article: PreviewArticleData; onClose: () => void }) {
  const [lang, setLang] = useState<'ta' | 'en'>('ta');
  const title = lang === 'ta' ? article.titleTa : (article.titleEn || article.titleTa);
  const body = lang === 'ta' ? article.bodyTa : (article.bodyEn || article.bodyTa);
  const hasBody = body && body.replace(/<[^>]*>/g, '').trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
            {article.status && (
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${STATUS_BADGE[article.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {article.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button type="button" onClick={() => setLang('ta')}
                className={`px-2.5 py-1 text-2xs font-medium rounded-md transition-all ${lang === 'ta' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                தமிழ்
              </button>
              <button type="button" onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-2xs font-medium rounded-md transition-all ${lang === 'en' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                English
              </button>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Card — mimics the reader app's article view */}
        {article.isBreaking && (
          <div className="bg-red-600 text-white text-2xs font-bold px-4 py-1.5 flex items-center gap-1.5 tracking-wide">
            <Radio size={11} /> BREAKING NEWS
          </div>
        )}

        {article.thumbnailUrl ? (
          <img src={article.thumbnailUrl} alt="" className="w-full h-52 object-cover bg-gray-100" />
        ) : (
          <div className="w-full h-52 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No thumbnail</div>
        )}

        <div className="p-4 space-y-2.5">
          {article.categoryName && (
            <span className="inline-block text-2xs font-bold text-red-600 uppercase tracking-wide">{article.categoryName}</span>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{title || <span className="text-gray-300">Untitled</span>}</h1>
          {article.byline && <p className="text-xs text-gray-500">By {article.byline}</p>}
          {article.excerpt && <p className="text-sm text-gray-600 italic">{article.excerpt}</p>}

          <div
            className="text-sm text-gray-800 leading-relaxed pt-1
              [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1
              [&_strong]:font-semibold [&_a]:text-red-600 [&_a]:underline
              [&_img]:rounded-lg [&_img]:my-3 [&_img]:w-full"
            dangerouslySetInnerHTML={{ __html: hasBody ? body! : '<p class="text-gray-300">No content yet</p>' }}
          />

          {article.mediaUrls && article.mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {article.mediaUrls.map((u, i) => (
                <img key={i} src={u} alt="" className="w-full h-24 object-cover rounded-lg bg-gray-100" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
