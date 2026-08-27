// src/lib/richText.ts
//
// Article bodies (Article.bodyTa / bodyEn) are stored as HTML from the admin
// panel's Tiptap editor (see apps/admin-panel/src/pages/ArticleFormPage.tsx
// — StarterKit + Image + Link extensions). Anywhere that HTML was rendered
// straight into a plain <Text> — the full article screen and every feed-
// card preview — was showing raw tags like "<p>...</p>" instead of
// formatted text. stripHtmlToPlainText() is for short previews (feed cards,
// excerpts) where plain text is correct; ArticleBody.tsx (same folder's
// sibling in components/) renders the full body with real formatting.

export function stripHtmlToPlainText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|h3|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
