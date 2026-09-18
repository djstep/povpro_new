import { newBlockId, type ContentBlock } from '@/lib/cms/content-blocks';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max = 42): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function sectionLabel(html: string, index: number): string {
  const heading = html.match(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/i);
  if (heading) {
    const text = stripTags(heading[2]);
    if (text) return truncate(text);
  }
  const text = stripTags(html).slice(0, 60);
  if (text) return truncate(text);
  return `Секция ${index + 1}`;
}

/**
 * Делит HTML на верхнеуровневые <section>…</section> с учётом вложенности.
 * Фрагменты вне section сохраняются отдельными кусками.
 */
export function splitTopLevelSections(innerHtml: string): string[] {
  const parts: string[] = [];
  let i = 0;
  const html = innerHtml;
  let buffer = '';

  while (i < html.length) {
    const openIdx = html.toLowerCase().indexOf('<section', i);
    if (openIdx === -1) {
      buffer += html.slice(i);
      break;
    }

    buffer += html.slice(i, openIdx);
    if (buffer.trim()) {
      parts.push(buffer);
      buffer = '';
    }

    const tagEnd = html.indexOf('>', openIdx);
    if (tagEnd === -1) {
      buffer += html.slice(openIdx);
      break;
    }

    let depth = 1;
    let pos = tagEnd + 1;
    while (pos < html.length && depth > 0) {
      const nextOpen = html.toLowerCase().indexOf('<section', pos);
      const nextClose = html.toLowerCase().indexOf('</section>', pos);
      if (nextClose === -1) {
        buffer += html.slice(openIdx);
        return parts.concat(buffer.trim() ? [buffer] : []);
      }
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        pos = html.indexOf('>', nextOpen) + 1;
      } else {
        depth -= 1;
        pos = nextClose + '</section>'.length;
        if (depth === 0) {
          parts.push(html.slice(openIdx, pos));
          i = pos;
        }
      }
    }
    if (depth !== 0) break;
  }

  if (buffer.trim()) parts.push(buffer);
  return parts.filter((p) => p.trim().length > 0);
}

/**
 * Импорт существующего HTML страницы в блоки с сохранением вёрстки.
 * Создаёт скрытый shell (main attrs) + секции как raw html.
 */
export function htmlToContentBlocks(html: string): ContentBlock[] {
  const trimmed = html.trim();
  if (!trimmed) {
    return [
      {
        id: newBlockId(),
        type: 'html',
        content: '<section><p>Пустая страница</p></section>',
        raw: true,
        label: 'Секция 1',
      },
    ];
  }

  const mainRe = /<main\b([^>]*)>([\s\S]*)<\/main>/i;
  const mainMatch = mainRe.exec(trimmed);

  if (!mainMatch) {
    const chunks = splitTopLevelSections(trimmed);
    if (chunks.length <= 1) {
      return [
        {
          id: newBlockId(),
          type: 'html',
          content: trimmed,
          raw: true,
          label: sectionLabel(trimmed, 0),
        },
      ];
    }
    return chunks.map((chunk, index) => ({
      id: newBlockId(),
      type: 'html' as const,
      content: chunk,
      raw: true,
      label: sectionLabel(chunk, index),
    }));
  }

  const before = trimmed.slice(0, mainMatch.index);
  const after = trimmed.slice(mainMatch.index + mainMatch[0].length);
  const mainAttrs = mainMatch[1] ?? '';
  const inner = mainMatch[2] ?? '';
  const chunks = splitTopLevelSections(inner);

  const blocks: ContentBlock[] = [
    {
      id: newBlockId(),
      type: 'shell',
      before,
      mainAttrs,
      after,
    },
  ];

  if (chunks.length === 0) {
    blocks.push({
      id: newBlockId(),
      type: 'html',
      content: inner.trim() || '<section></section>',
      raw: true,
      label: 'Содержимое',
    });
    return blocks;
  }

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    blocks.push({
      id: newBlockId(),
      type: 'html',
      content: chunk,
      raw: true,
      label: sectionLabel(chunk, index),
    });
  }

  return blocks;
}

/** Применяет текстовые правки (как на сервере) перед импортом в блоки */
export function applyTextOverridesLocally(
  html: string,
  blocks: { originalText: string; content: string }[],
): string {
  let out = html;
  for (const block of blocks) {
    if (block.content === block.originalText) continue;
    const idx = out.indexOf(block.originalText);
    if (idx === -1) continue;
    out = out.slice(0, idx) + block.content + out.slice(idx + block.originalText.length);
  }
  return out;
}
