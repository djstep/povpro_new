/** Типы и рендер блочного контента страниц */

export type ContentBlock =
  | { id: string; type: 'hero'; title: string; subtitle?: string; image?: string; badge?: string }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; src: string; alt?: string; caption?: string }
  | { id: string; type: 'video'; src: string; poster?: string }
  | { id: string; type: 'html'; content: string };

export function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isContentBlock);
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

export function renderContentBlocks(blocks: ContentBlock[]): string {
  if (blocks.length === 0) return '';

  const parts = blocks.map((block) => {
    switch (block.type) {
      case 'hero':
        return `<section class="page-spaced-section max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full py-12 md:py-16">
  <div class="liquid-glass rounded-xl p-8 md:p-16 flex flex-col md:flex-row gap-8 items-center">
    <div class="flex-1 flex flex-col gap-4">
      ${block.badge ? `<div class="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 w-max"><span class="font-mono-label text-mono-label text-primary uppercase">${esc(block.badge)}</span></div>` : ''}
      <h1 class="font-headline-xl text-headline-xl text-on-surface">${esc(block.title)}</h1>
      ${block.subtitle ? `<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">${esc(block.subtitle)}</p>` : ''}
    </div>
    ${block.image ? `<div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden"><img src="${esc(block.image)}" alt="${esc(block.title)}" class="w-full h-full object-cover" loading="lazy"/></div>` : ''}
  </div>
</section>`;
      case 'heading': {
        const tag = `h${block.level}`;
        const cls =
          block.level === 1
            ? 'font-headline-xl text-headline-xl'
            : block.level === 2
              ? 'font-headline-lg text-headline-lg-mobile md:text-headline-lg'
              : 'font-headline-lg-mobile text-headline-lg-mobile';
        return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8"><${tag} class="${cls} text-on-surface">${esc(block.text)}</${tag}></section>`;
      }
      case 'text':
        return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8"><div class="font-body-md text-body-md text-on-surface-variant prose prose-invert max-w-none">${block.content}</div></section>`;
      case 'image':
        return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8">
  <figure class="liquid-card rounded-xl overflow-hidden p-2">
    <img src="${esc(block.src)}" alt="${esc(block.alt ?? '')}" class="w-full rounded-lg object-cover max-h-[32rem]" loading="lazy"/>
    ${block.caption ? `<figcaption class="font-body-md text-body-md text-on-surface-variant mt-3 px-2">${esc(block.caption)}</figcaption>` : ''}
  </figure>
</section>`;
      case 'video':
        return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8">
  <div class="liquid-card rounded-xl overflow-hidden p-2">
    <video src="${esc(block.src)}" ${block.poster ? `poster="${esc(block.poster)}"` : ''} controls class="w-full rounded-lg max-h-[32rem]" playsinline></video>
  </div>
</section>`;
      case 'html':
        return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8">${block.content}</section>`;
      default:
        return '';
    }
  });

  return `<main class="flex-grow pt-32 md:pt-40 w-full flex flex-col gap-gutter pb-24">${parts.join('\n')}</main>`;
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
