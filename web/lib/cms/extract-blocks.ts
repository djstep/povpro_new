export type ExtractedTextBlock = {
  blockKey: string;
  label: string;
  originalText: string;
  tag: string;
};

const BLOCK_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'td', 'th', 'figcaption', 'blockquote'];

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** Извлекает редактируемые текстовые блоки из HTML страницы */
export function extractTextBlocks(html: string, pageSlug: string): ExtractedTextBlock[] {
  const blocks: ExtractedTextBlock[] = [];
  const counters: Record<string, number> = {};

  for (const tag of BLOCK_TAGS) {
    const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      const inner = match[2];
      if (inner.includes('<h') || inner.includes('<p') || inner.includes('<div')) continue;
      const text = stripTags(inner);
      if (text.length < 4) continue;
      counters[tag] = (counters[tag] ?? 0) + 1;
      const blockKey = `${pageSlug}::${tag}-${counters[tag]}`;
      blocks.push({
        blockKey,
        label: `<${tag}> ${truncate(text)}`,
        originalText: text,
        tag,
      });
    }
  }

  return blocks;
}
