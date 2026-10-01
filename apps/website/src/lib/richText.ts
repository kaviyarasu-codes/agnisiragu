// src/lib/richText.ts
//
// Article bodies (Article.bodyTa / bodyEn) are Tiptap-authored HTML, but
// reporters routinely paste text copied straight from WhatsApp into the
// body instead of using the toolbar's Bold button or "insert link" dialog.
// That leaves two things broken in the raw HTML this app renders via
// dangerouslySetInnerHTML:
//   - a bare URL (e.g. a WhatsApp group invite link) sits there as plain
//     text, not a clickable <a>
//   - WhatsApp-style *bold*/**bold** markers show up as literal asterisks
//     instead of being bold
//
// enrichArticleHtml() fixes both, tag-aware: it only touches text that's
// NOT already inside an HTML tag, and tracks whether it's currently inside
// an existing <a>...</a> so it never nests a second anchor inside a real
// link. The admin panel's editor (ArticleFormPage.tsx) now also autolinks
// pasted URLs going forward — this covers content already saved before
// that change, and anything pasted outside the editor's paste handler.

const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const BOLD_RE = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;

function linkifyAndBold(text: string): string {
  const linked = text.replace(URL_RE, (match) => {
    const href = match.startsWith('www.') ? `https://${match}` : match;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${match}</a>`;
  });
  return linked.replace(BOLD_RE, (_m, d, s) => `<strong>${d ?? s}</strong>`);
}

function boldOnly(text: string): string {
  return text.replace(BOLD_RE, (_m, d, s) => `<strong>${d ?? s}</strong>`);
}

export function enrichArticleHtml(html: string | undefined | null): string {
  if (!html) return '';
  const parts = html.split(/(<[^>]+>)/g);
  let anchorDepth = 0;

  return parts
    .map((part) => {
      if (!part) return part;
      if (part.startsWith('<')) {
        if (/^<a\b/i.test(part)) anchorDepth += 1;
        else if (/^<\/a>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
        return part;
      }
      // Already inside a real <a>...</a> — only fix bold markdown, skip
      // URL-linkifying so we never nest an <a> inside another <a>.
      return anchorDepth > 0 ? boldOnly(part) : linkifyAndBold(part);
    })
    .join('');
}
