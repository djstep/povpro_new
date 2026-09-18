export type ExtractedTextBlock = {
  blockKey: string;
  label: string;
  originalText: string;
  tag: string;
};

const BLOCK_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'td', 'th', 'figcaption', 'blockquote'];

const TAG_KIND: Record<string, string> = {
  h1: 'Главный заголовок',
  h2: 'Заголовок раздела',
  h3: 'Подзаголовок',
  h4: 'Подзаголовок',
  h5: 'Подзаголовок',
  h6: 'Подзаголовок',
  p: 'Абзац',
  li: 'Пункт списка',
  td: 'Ячейка таблицы',
  th: 'Заголовок таблицы',
  figcaption: 'Подпись к изображению',
  blockquote: 'Цитата',
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function friendlyLabel(tag: string, text: string, sectionTitle: string | null): string {
  const kind = TAG_KIND[tag] ?? 'Текст';
  const snippet = truncate(text);
  if (tag.startsWith('h')) {
    return `${kind} «${snippet}»`;
  }
  if (sectionTitle) {
    return `${kind} в разделе «${truncate(sectionTitle, 36)}»`;
  }
  return `${kind}: «${snippet}»`;
}

/** Извлекает редактируемые текстовые блоки из HTML страницы */
export function extractTextBlocks(html: string, pageSlug: string): ExtractedTextBlock[] {
  const blocks: ExtractedTextBlock[] = [];
  const counters: Record<string, number> = {};
  let sectionTitle: string | null = null;

  // Один проход в порядке появления в документе (не по типам тегов)
  const re = new RegExp(`<(${BLOCK_TAGS.join('|')})([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[3];
    if (/<(?:h[1-6]|p|div)\b/i.test(inner)) continue;
    const text = stripTags(inner);
    if (text.length < 4) continue;

    if (tag === 'h1' || tag === 'h2') {
      sectionTitle = text;
    }

    counters[tag] = (counters[tag] ?? 0) + 1;
    const blockKey = `${pageSlug}::${tag}-${counters[tag]}`;
    blocks.push({
      blockKey,
      label: friendlyLabel(tag, text, tag.startsWith('h') ? null : sectionTitle),
      originalText: text,
      tag,
    });
  }

  return blocks;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Подставляет черновик текста в базовый HTML и помечает блоки для click-to-edit.
 * Порядок и логика поиска совпадают с applyTextBlockOverrides.
 */
export function buildAnnotatedTextPreview(
  baseHtml: string,
  blocks: { blockKey: string; originalText: string; content: string }[],
  activeKey?: string | null,
): string {
  let out = baseHtml;
  const tokens: { token: string; blockKey: string; content: string }[] = [];

  for (const block of blocks) {
    const idx = out.indexOf(block.originalText);
    if (idx === -1) continue;
    const token = `<!--CMS_BLOCK_${tokens.length}-->`;
    out = out.slice(0, idx) + token + out.slice(idx + block.originalText.length);
    tokens.push({ token, blockKey: block.blockKey, content: block.content });
  }

  for (const t of tokens) {
    const active = activeKey === t.blockKey ? ' is-active' : '';
    const wrapped = `<span data-cms-block="${escapeAttr(t.blockKey)}" class="cms-editable${active}" tabindex="0" role="button">${escapeText(t.content)}</span>`;
    out = out.split(t.token).join(wrapped);
  }

  return out;
}
