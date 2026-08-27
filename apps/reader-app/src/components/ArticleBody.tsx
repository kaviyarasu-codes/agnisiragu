// src/components/ArticleBody.tsx
//
// Renders an article's HTML body (from the admin panel's Tiptap editor —
// StarterKit + Image + Link, see ArticleFormPage.tsx) as real native text
// instead of raw tags. Deliberately NOT a general HTML renderer (no new
// dependency — this app is on React 19 / RN 0.85, ahead of what most HTML-
// render libraries currently support) — it's scoped to exactly what that
// editor's toolbar can produce: paragraphs, line breaks, bold, italic, one
// heading level, bullet/numbered list items, and links.
//
// Before this component existed, ArticleDetailScreen rendered the body as
// `<Text>{article.bodyTa}</Text>`, so every article showed literal
// "<p>...</p>" (and similar) tags to the reader.

import React from 'react';
import { Text, View, StyleSheet, Linking, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

interface ArticleBodyProps {
  html: string | undefined | null;
  textStyle: StyleProp<TextStyle>;
  linkColor: string;
  style?: StyleProp<ViewStyle>;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

// Strips any tag that slips through unrecognized (defensive — keeps a
// malformed/unexpected fragment from leaking raw markup into view).
function cleanInnerText(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ''));
}

const INLINE_RE = /<a\b([^>]*)>([\s\S]*?)<\/a>|<(strong|b)>([\s\S]*?)<\/\3>|<(em|i)>([\s\S]*?)<\/\5>|<br\s*\/?>/gi;

function renderInline(html: string, keyPrefix: string, linkColor: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((m = INLINE_RE.exec(html))) {
    if (m.index > lastIndex) {
      nodes.push(decodeEntities(html.slice(lastIndex, m.index)));
    }

    if (m[1] !== undefined) {
      // <a ...attrs...>text</a>
      const hrefMatch = /href="([^"]*)"/i.exec(m[1]);
      const href = hrefMatch?.[1];
      const text = cleanInnerText(m[2]);
      nodes.push(
        <Text
          key={`${keyPrefix}-${idx++}`}
          style={{ color: linkColor, textDecorationLine: 'underline' }}
          onPress={href ? () => { Linking.openURL(href).catch(() => {}); } : undefined}
        >
          {text}
        </Text>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <Text key={`${keyPrefix}-${idx++}`} style={{ fontWeight: '700' }}>{cleanInnerText(m[4])}</Text>,
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <Text key={`${keyPrefix}-${idx++}`} style={{ fontStyle: 'italic' }}>{cleanInnerText(m[6])}</Text>,
      );
    } else {
      // <br>
      nodes.push('\n');
    }

    lastIndex = INLINE_RE.lastIndex;
  }

  if (lastIndex < html.length) {
    nodes.push(decodeEntities(html.slice(lastIndex)));
  }

  return nodes;
}

type Block = { type: 'h2' | 'li' | 'p'; content: string };

const BLOCK_RE = /<h2>([\s\S]*?)<\/h2>|<li>([\s\S]*?)<\/li>|<p>([\s\S]*?)<\/p>/gi;

function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  let matched = false;
  let m: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;

  while ((m = BLOCK_RE.exec(html))) {
    matched = true;
    if (m[1] !== undefined) blocks.push({ type: 'h2', content: m[1] });
    else if (m[2] !== undefined) blocks.push({ type: 'li', content: m[2] });
    else if (m[3] !== undefined) blocks.push({ type: 'p', content: m[3] });
  }

  // No recognized block tags at all — plain text or an unexpected shape.
  // Render it as one paragraph rather than silently dropping content.
  if (!matched && html.trim()) {
    blocks.push({ type: 'p', content: html });
  }

  return blocks;
}

export default function ArticleBody({ html, textStyle, linkColor, style }: ArticleBodyProps) {
  if (!html) return null;
  const blocks = parseBlocks(html);

  return (
    <View style={style}>
      {blocks.map((b, i) => {
        if (b.type === 'h2') {
          return (
            <Text key={i} style={[textStyle, styles.heading]}>
              {renderInline(b.content, `h-${i}`, linkColor)}
            </Text>
          );
        }
        if (b.type === 'li') {
          return (
            <View key={i} style={styles.liRow}>
              <Text style={[textStyle, styles.bullet]}>{'•'}</Text>
              <Text style={[textStyle, styles.liText]}>{renderInline(b.content, `li-${i}`, linkColor)}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[textStyle, styles.paragraph]}>
            {renderInline(b.content, `p-${i}`, linkColor)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontWeight: '700', fontSize: 17, marginTop: 14, marginBottom: 8 },
  paragraph: { marginBottom: 14 },
  liRow: { flexDirection: 'row', marginBottom: 8, paddingLeft: 4 },
  bullet: { marginRight: 8 },
  liText: { flex: 1 },
});
