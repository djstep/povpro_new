import type { MediaOverride, TextBlock } from '@prisma/client';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceSrcInHtml(html: string, originalSrc: string, replacementSrc: string, kind: string): string {
  const escaped = escapeRegExp(originalSrc);
  let out = html;

  out = out.replace(new RegExp(`(src=["'])${escaped}(["'])`, 'g'), `$1${replacementSrc}$2`);
  out = out.replace(new RegExp(`(poster=["'])${escaped}(["'])`, 'g'), `$1${replacementSrc}$2`);

  if (kind === 'VIDEO') {
    out = out.replace(new RegExp(`(<(?:video|source)[^>]+src=["'])${escaped}(["'])`, 'gi'), `$1${replacementSrc}$2`);
  }

  out = out.replace(new RegExp(`url\\(['"]?${escaped}['"]?\\)`, 'g'), `url('${replacementSrc}')`);

  if (kind === 'IMAGE') {
    out = out.replace(new RegExp(`(<img[^>]+src=["'])${escaped}(["'])`, 'gi'), `$1${replacementSrc}$2`);
    if (replacementSrc !== originalSrc) {
      const altEscaped = escapeRegExp(originalSrc);
      // alt updates handled separately via MediaOverride.alt if needed
      void altEscaped;
    }
  }

  return out;
}

export function applyMediaOverrides(html: string, overrides: MediaOverride[]): string {
  let out = html;
  const sorted = [...overrides].sort((a, b) => b.originalSrc.length - a.originalSrc.length);
  for (const item of sorted) {
    if (item.replacementSrc === item.originalSrc) continue;
    out = replaceSrcInHtml(out, item.originalSrc, item.replacementSrc, item.kind);
    if (item.alt && item.kind === 'IMAGE') {
      const escaped = escapeRegExp(item.originalSrc);
      out = out.replace(
        new RegExp(`(<img[^>]+src=["']${escaped}["'][^>]*)(>)`, 'i'),
        (full, head: string, tail: string) => {
          if (/\balt=/.test(head)) {
            return head.replace(/\balt=["'][^"']*["']/, `alt="${item.alt}"`) + tail;
          }
          return `${head} alt="${item.alt}"${tail}`;
        },
      );
      out = out.replace(
        new RegExp(`(<img[^>]+)(src=["']${escaped}["'])`, 'i'),
        (full, head: string, srcPart: string) => {
          if (/\balt=/.test(head)) return full;
          return `${head} alt="${item.alt}" ${srcPart}`;
        },
      );
    }
  }
  return out;
}

export function applyTextBlockOverrides(html: string, blocks: TextBlock[]): string {
  let out = html;
  for (const block of blocks) {
    if (block.content === block.originalText) continue;
    const original = block.originalText;
    const replacement = block.content;
    const idx = out.indexOf(original);
    if (idx === -1) continue;
    out = out.slice(0, idx) + replacement + out.slice(idx + original.length);
  }
  return out;
}
