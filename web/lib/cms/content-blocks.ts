/** Типы и рендер блочного контента страниц */

export type ButtonItem = { label: string; href: string };

/** Положение фото в карточке: во всю ширину или рядом с текстом */
export type ImageLayout = 'full' | 'right' | 'left';

export type ContentBlock =
  | {
      id: string;
      type: 'shell';
      before: string;
      mainAttrs: string;
      after: string;
    }
  | { id: string; type: 'hero'; title: string; subtitle?: string; image?: string; badge?: string }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; src: string; alt?: string; caption?: string; layout?: ImageLayout }
  | { id: string; type: 'video'; src: string; poster?: string }
  | { id: string; type: 'buttons'; items: ButtonItem[]; align?: 'left' | 'center' }
  | { id: string; type: 'html'; content: string; raw?: boolean; label?: string };

export function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isContentBlock).map((b) =>
      b.type === 'buttons' && !Array.isArray(b.items) ? { ...b, items: [] } : b,
    );
  } catch {
    return [];
  }
}

function isContentBlock(value: unknown): value is ContentBlock {
  if (!value || typeof value !== 'object') return false;
  const v = value as { type?: string; id?: string };
  return typeof v.id === 'string' && typeof v.type === 'string';
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHref(href: string): string {
  const value = href.trim();
  if (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return '#';
}

/** Обычный текст без тегов → абзацы (пустая строка — новый абзац, перенос — <br>) */
function textToHtml(content: string): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  return content
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function isDocumentHref(href: string): boolean {
  return /\.pdf(\?|#|$)/i.test(href);
}

function renderButtons(block: Extract<ContentBlock, { type: 'buttons' }>, defaultAlign: 'left' | 'center'): string {
  const items = block.items.filter((i) => i.href.trim() && i.label.trim());
  if (items.length === 0) return '';
  const align = block.align ?? defaultAlign;
  const links = items
    .map((item) => {
      const href = safeHref(item.href);
      const external = isDocumentHref(href) || /^https?:\/\//i.test(href);
      const icon = isDocumentHref(href) ? 'present_to_all' : 'arrow_forward';
      return `<a class="cms-button" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${esc(item.label)}</a>`;
    })
    .join('');
  return `<div class="cms-buttons${align === 'center' ? ' cms-buttons--center' : ''}">${links}</div>`;
}

type FlowBlock = Extract<ContentBlock, { type: 'heading' | 'text' | 'image' | 'video' | 'buttons' }>;

const FLOW_TYPES = new Set<ContentBlock['type']>(['heading', 'text', 'image', 'video', 'buttons']);

function isFlowBlock(block: ContentBlock): block is FlowBlock {
  return FLOW_TYPES.has(block.type);
}

function renderImageFigure(block: Extract<ContentBlock, { type: 'image' }>, extraClass = ''): string {
  if (!block.src) return '';
  return `<figure class="cms-figure${extraClass}"><img src="${esc(block.src)}" alt="${esc(block.alt ?? '')}" loading="eager" decoding="async"/>${
    block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''
  }</figure>`;
}

function renderFlowItem(block: FlowBlock): string {
  switch (block.type) {
    case 'heading':
      return block.level === 3
        ? `<h3 class="cms-h3">${esc(block.text)}</h3>`
        : `<h2 class="cms-h2">${esc(block.text)}</h2>`;
    case 'text':
      return `<div class="cms-text">${textToHtml(block.content)}</div>`;
    case 'image':
      return renderImageFigure(block);
    case 'video':
      if (!block.src) return '';
      return `<figure class="cms-figure"><video src="${esc(block.src)}" ${block.poster ? `poster="${esc(block.poster)}"` : ''} controls playsinline></video></figure>`;
    case 'buttons':
      return renderButtons(block, 'left');
  }
}

/**
 * Подряд идущие заголовки/текст/фото/видео/кнопки выводятся одной «стеклянной» карточкой,
 * как секции сайта. Фото с положением «справа/слева» ставится рядом с текстом.
 */
function renderFlowGroup(group: FlowBlock[]): string {
  if (group.every((b) => b.type === 'buttons')) {
    const html = group
      .map((b) => renderButtons(b as Extract<FlowBlock, { type: 'buttons' }>, 'center'))
      .join('');
    return html ? `<section class="cms-section">${html}</section>` : '';
  }

  const media = group.find(
    (b): b is Extract<FlowBlock, { type: 'image' }> =>
      b.type === 'image' && Boolean(b.src) && (b.layout === 'right' || b.layout === 'left'),
  );
  const body = group
    .filter((b) => b !== media)
    .map(renderFlowItem)
    .filter(Boolean)
    .join('\n');

  if (media && body) {
    const cls = `cms-card cms-card--split${media.layout === 'left' ? ' cms-card--media-left' : ''}`;
    return `<section class="cms-section"><div class="${cls}"><div class="cms-card__body">${body}</div>${renderImageFigure(media, ' cms-card__media')}</div></section>`;
  }

  const inner = media ? renderImageFigure(media) : body;
  if (!inner) return '';
  return `<section class="cms-section"><div class="cms-card"><div class="cms-card__body">${inner}</div></div></section>`;
}

function renderBlockList(blocks: ContentBlock[]): string {
  const out: string[] = [];
  let group: FlowBlock[] = [];
  const flush = () => {
    if (group.length > 0) out.push(renderFlowGroup(group));
    group = [];
  };

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1) {
      flush();
      out.push(`<section class="cms-section"><h1 class="cms-page-title">${esc(block.text)}</h1></section>`);
      continue;
    }
    if (isFlowBlock(block)) {
      if (block.type === 'heading' && block.level === 2) flush();
      group.push(block);
      continue;
    }
    flush();
    out.push(renderOne(block));
  }
  flush();

  return out.filter(Boolean).join('\n');
}

function renderOne(block: ContentBlock): string {
  switch (block.type) {
    case 'shell':
      return '';
    case 'hero':
      return `<section class="page-spaced-section max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full py-12 md:py-16">
  <div class="liquid-glass rounded-xl p-8 md:p-16 flex flex-col md:flex-row gap-8 items-center">
    <div class="flex-1 flex flex-col gap-4">
      ${block.badge ? `<div class="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 w-max"><span class="font-mono-label text-mono-label text-primary uppercase">${esc(block.badge)}</span></div>` : ''}
      <h1 class="font-headline-xl text-headline-xl text-on-surface">${esc(block.title)}</h1>
      ${block.subtitle ? `<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">${esc(block.subtitle)}</p>` : ''}
    </div>
    ${block.image ? `<div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden"><img src="${esc(block.image)}" alt="${esc(block.title)}" class="w-full h-full object-cover" loading="eager" decoding="async"/></div>` : ''}
  </div>
</section>`;
    case 'html':
      if (block.raw) return block.content;
      return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8">${block.content}</section>`;
    default:
      return '';
  }
}

export function renderContentBlocks(blocks: ContentBlock[]): string {
  if (blocks.length === 0) return '';

  const shell = blocks.find((b): b is Extract<ContentBlock, { type: 'shell' }> => b.type === 'shell');
  const inner = renderBlockList(blocks.filter((b) => b.type !== 'shell'));

  if (shell) {
    return `${shell.before}<main${shell.mainAttrs}>${inner}</main>${shell.after}`;
  }

  const hasRawHtml = blocks.some((b) => b.type === 'html' && b.raw);
  if (hasRawHtml) {
    return inner;
  }

  return `<main class="flex-grow pt-32 md:pt-40 w-full flex flex-col gap-gutter pb-24">${inner}</main>`;
}

export function defaultContentBlocks(title: string): ContentBlock[] {
  return [
    {
      id: crypto.randomUUID?.() ?? `b-${Date.now()}`,
      type: 'hero',
      title,
      subtitle: 'Описание страницы',
    },
    {
      id: crypto.randomUUID?.() ?? `b-${Date.now()}-t`,
      type: 'text',
      content: '<p>Текст страницы. Добавьте блоки изображений, видео и заголовков.</p>',
    },
  ];
}

/** Node-safe UUID for server */
export function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultContentBlocksServer(title: string): ContentBlock[] {
  return [
    { id: newBlockId(), type: 'hero', title, subtitle: 'Описание страницы' },
    {
      id: newBlockId(),
      type: 'text',
      content: '<p>Текст страницы. Добавьте блоки изображений, видео и заголовков.</p>',
    },
  ];
}

export function blockTypeLabel(block: ContentBlock): string {
  switch (block.type) {
    case 'shell':
      return 'Оболочка страницы';
    case 'hero':
      return 'Hero-блок';
    case 'heading':
      return 'Заголовок';
    case 'text':
      return 'Текст';
    case 'image':
      return 'Изображение';
    case 'video':
      return 'Видео';
    case 'buttons':
      return block.items.some((i) => isDocumentHref(i.href)) ? 'Кнопки-презентации' : 'Кнопки';
    case 'html':
      return block.label || (block.raw ? 'Секция страницы' : 'HTML-блок');
    default:
      return 'Блок';
  }
}

export function isEditableContentBlock(block: ContentBlock): boolean {
  return block.type !== 'shell';
}
