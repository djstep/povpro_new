/** Типы и рендер блочного контента страниц */

export type ButtonItem = { label: string; href: string };

/** Положение фото в карточке: во всю ширину или рядом с текстом */
export type ImageLayout = 'full' | 'right' | 'left';

export type Spacing = 'none' | 's' | 'm' | 'l';
export type SectionWidth = 'narrow' | 'normal' | 'wide';
export type SectionBackground = 'glass' | 'accent' | 'none';
export type TextAlign = 'left' | 'center';
export type Columns = 2 | 3 | 4;
export type MediaRatio = 'auto' | 'landscape' | 'square' | 'portrait';

/** Общие настройки секций конструктора */
export type SectionStyle = {
  background?: SectionBackground;
  width?: SectionWidth;
  spaceTop?: Spacing;
  spaceBottom?: Spacing;
};

export type CardItem = { icon?: string; image?: string; title: string; text?: string; href?: string };
export type StatItem = { value: string; label: string };
export type GalleryItem = { src: string; caption?: string };

export type ContentBlock =
  | {
      id: string;
      type: 'shell';
      before: string;
      mainAttrs: string;
      after: string;
    }
  | {
      id: string;
      type: 'hero';
      title: string;
      subtitle?: string;
      image?: string;
      badge?: string;
      imagePosition?: 'right' | 'left';
      buttons?: ButtonItem[];
    }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; src: string; alt?: string; caption?: string; layout?: ImageLayout }
  | { id: string; type: 'video'; src: string; poster?: string }
  | ({ id: string; type: 'buttons'; items: ButtonItem[]; align?: TextAlign } & SectionStyle)
  | { id: string; type: 'html'; content: string; raw?: boolean; label?: string }
  | ({
      id: string;
      type: 'title';
      text: string;
      subtitle?: string;
      eyebrow?: string;
      size?: 'page' | 'section';
      align?: TextAlign;
    } & SectionStyle)
  | ({
      id: string;
      type: 'textMedia';
      eyebrow?: string;
      title?: string;
      subtitle?: string;
      text?: string;
      mediaType?: 'image' | 'video' | 'none';
      image?: string;
      video?: string;
      alt?: string;
      caption?: string;
      mediaPosition?: 'right' | 'left' | 'top' | 'bottom';
      mediaSize?: 'third' | 'half' | 'twoThirds';
      mediaRatio?: MediaRatio;
      verticalAlign?: 'start' | 'center';
      textAlign?: TextAlign;
      buttons?: ButtonItem[];
    } & SectionStyle)
  | ({
      id: string;
      type: 'cards';
      title?: string;
      subtitle?: string;
      columns?: Columns;
      cardStyle?: 'glass' | 'outline' | 'plain';
      textAlign?: TextAlign;
      items: CardItem[];
    } & SectionStyle)
  | ({ id: string; type: 'stats'; title?: string; columns?: Columns; items: StatItem[] } & SectionStyle)
  | ({
      id: string;
      type: 'gallery';
      title?: string;
      columns?: Columns;
      ratio?: MediaRatio;
      items: GalleryItem[];
    } & SectionStyle)
  | ({ id: string; type: 'videoSection'; title?: string; src: string; poster?: string; caption?: string } & SectionStyle)
  | ({
      id: string;
      type: 'cta';
      title: string;
      text?: string;
      buttonLabel?: string;
      href?: string;
      secondaryLabel?: string;
      secondaryHref?: string;
    } & SectionStyle)
  | { id: string; type: 'spacer'; size?: 's' | 'm' | 'l' | 'xl' };

export type ContentBlockType = ContentBlock['type'];

const ARRAY_PROPS: Partial<Record<ContentBlockType, string>> = {
  buttons: 'items',
  cards: 'items',
  stats: 'items',
  gallery: 'items',
};

export function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isContentBlock).map((b) => {
      const key = ARRAY_PROPS[b.type];
      const record = b as unknown as Record<string, unknown>;
      if (key && !Array.isArray(record[key])) return { ...b, [key]: [] } as ContentBlock;
      return b;
    });
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
export function textToHtml(content: string): string {
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

function isEmptyRichText(html: string | undefined): boolean {
  return !html || !html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function renderButtonLinks(items: ButtonItem[], primaryFirst = false): string {
  return items
    .filter((i) => i.href?.trim() && i.label?.trim())
    .map((item, index) => {
      const href = safeHref(item.href);
      const external = isDocumentHref(href) || /^https?:\/\//i.test(href);
      const icon = isDocumentHref(href) ? 'present_to_all' : 'arrow_forward';
      const cls = primaryFirst && index === 0 ? 'cms-button cms-button--primary' : 'cms-button';
      return `<a class="${cls}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${esc(item.label)}</a>`;
    })
    .join('');
}

function renderButtons(items: ButtonItem[], align: TextAlign): string {
  const links = renderButtonLinks(items);
  if (!links) return '';
  return `<div class="cms-buttons${align === 'center' ? ' cms-buttons--center' : ''}">${links}</div>`;
}

/* ---------- Секции конструктора ---------- */

function sectionClass(style: SectionStyle, extra = ''): string {
  const cls = ['cms-section'];
  if (style.width && style.width !== 'normal') cls.push(`cms-w-${style.width}`);
  if (style.spaceTop && style.spaceTop !== 'none') cls.push(`cms-pt-${style.spaceTop}`);
  if (style.spaceBottom && style.spaceBottom !== 'm') cls.push(`cms-mb-${style.spaceBottom}`);
  if (extra) cls.push(extra);
  return cls.join(' ');
}

function surfaceClass(background: SectionBackground, extra = ''): string {
  const base = background === 'none' ? 'cms-plain' : background === 'accent' ? 'cms-card cms-card--accent' : 'cms-card';
  return extra ? `${base} ${extra}` : base;
}

function wrapSection(style: SectionStyle, defaultBg: SectionBackground, inner: string, surfaceExtra = ''): string {
  if (!inner.trim()) return '';
  const bg = style.background ?? defaultBg;
  return `<section class="${sectionClass(style)}"><div class="${surfaceClass(bg, surfaceExtra)}">${inner}</div></section>`;
}

function blockHead(title?: string, subtitle?: string, align: TextAlign = 'left'): string {
  if (!title?.trim() && !subtitle?.trim()) return '';
  return `<div class="cms-block-head${align === 'center' ? ' cms-align-center' : ''}">${
    title?.trim() ? `<h2 class="cms-h2">${esc(title)}</h2>` : ''
  }${subtitle?.trim() ? `<p class="cms-lead">${esc(subtitle)}</p>` : ''}</div>`;
}

function eyebrowHtml(text?: string): string {
  return text?.trim() ? `<span class="cms-eyebrow">${esc(text)}</span>` : '';
}

function renderMediaFigure(
  kind: 'image' | 'video',
  src: string,
  opts: { alt?: string; caption?: string; poster?: string; ratio?: MediaRatio; extraClass?: string },
): string {
  const ratio = opts.ratio && opts.ratio !== 'auto' ? ` cms-ratio-${opts.ratio}` : '';
  const media =
    kind === 'video'
      ? `<video src="${esc(src)}"${opts.poster ? ` poster="${esc(opts.poster)}"` : ''} controls playsinline></video>`
      : `<img src="${esc(src)}" alt="${esc(opts.alt ?? '')}" loading="eager" decoding="async"/>`;
  return `<figure class="cms-figure${ratio}${opts.extraClass ?? ''}">${media}${
    opts.caption?.trim() ? `<figcaption>${esc(opts.caption)}</figcaption>` : ''
  }</figure>`;
}

function renderTitle(block: Extract<ContentBlock, { type: 'title' }>): string {
  if (!block.text?.trim() && !block.subtitle?.trim()) return '';
  const page = block.size !== 'section';
  const align = block.align ?? (page ? 'center' : 'left');
  const heading = page
    ? `<h1 class="cms-page-title">${esc(block.text)}</h1>`
    : `<h2 class="cms-h2 cms-h2--lg">${esc(block.text)}</h2>`;
  const inner = `<div class="cms-title${align === 'center' ? ' cms-align-center' : ''}">${eyebrowHtml(block.eyebrow)}${heading}${
    block.subtitle?.trim() ? `<p class="cms-lead">${esc(block.subtitle)}</p>` : ''
  }</div>`;
  return wrapSection(block, 'none', inner);
}

function renderTextMedia(block: Extract<ContentBlock, { type: 'textMedia' }>): string {
  const align = block.textAlign ?? 'left';
  const mediaType = block.mediaType ?? 'image';
  const mediaSrc = mediaType === 'video' ? block.video : mediaType === 'image' ? block.image : '';
  const hasMedia = mediaType !== 'none' && Boolean(mediaSrc?.trim());
  const position = block.mediaPosition ?? 'right';

  const bodyParts = [
    eyebrowHtml(block.eyebrow),
    block.title?.trim() ? `<h2 class="cms-h2">${esc(block.title)}</h2>` : '',
    block.subtitle?.trim() ? `<h3 class="cms-h3">${esc(block.subtitle)}</h3>` : '',
    !isEmptyRichText(block.text) ? `<div class="cms-text">${textToHtml(block.text ?? '')}</div>` : '',
    renderButtons(block.buttons ?? [], align),
  ].filter(Boolean);
  const body = bodyParts.length
    ? `<div class="cms-card__body${align === 'center' ? ' cms-align-center' : ''}">${bodyParts.join('')}</div>`
    : '';

  if (!hasMedia) return wrapSection(block, 'glass', body);

  const split = position === 'left' || position === 'right';
  const figure = renderMediaFigure(mediaType === 'video' ? 'video' : 'image', mediaSrc!, {
    alt: block.alt,
    caption: block.caption,
    ratio: block.mediaRatio,
    extraClass: split ? ' cms-card__media' : '',
  });

  if (!body) return wrapSection(block, 'glass', figure);

  if (split) {
    const cls = [
      'cms-split',
      `cms-split--${block.mediaSize ?? 'half'}`,
      position === 'left' ? 'cms-split--media-left' : '',
      block.verticalAlign === 'start' ? 'cms-split--top' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return wrapSection(block, 'glass', `${body}${figure}`, cls);
  }

  const stacked = position === 'top' ? `${figure}${body}` : `${body}${figure}`;
  return wrapSection(block, 'glass', stacked, 'cms-stack');
}

function renderCards(block: Extract<ContentBlock, { type: 'cards' }>): string {
  const align = block.textAlign ?? 'left';
  const style = block.cardStyle ?? 'glass';
  const items = block.items
    .filter((i) => i.title?.trim() || i.text?.trim() || i.image?.trim())
    .map((item) => {
      const tag = item.href?.trim() ? 'a' : 'div';
      const href = item.href?.trim() ? safeHref(item.href) : '';
      const external = href && (isDocumentHref(href) || /^https?:\/\//i.test(href));
      const attrs = tag === 'a' ? ` href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}` : '';
      return `<${tag} class="cms-item cms-item--${style}${align === 'center' ? ' cms-align-center' : ''}"${attrs}>${
        item.image?.trim()
          ? `<img class="cms-item__img" src="${esc(item.image)}" alt="${esc(item.title ?? '')}" loading="eager" decoding="async"/>`
          : ''
      }${
        item.icon?.trim()
          ? `<span class="material-symbols-outlined cms-item__icon" aria-hidden="true">${esc(item.icon.trim())}</span>`
          : ''
      }${item.title?.trim() ? `<h3 class="cms-h3">${esc(item.title)}</h3>` : ''}${
        !isEmptyRichText(item.text) ? `<div class="cms-text">${textToHtml(item.text ?? '')}</div>` : ''
      }</${tag}>`;
    })
    .join('');
  if (!items) return '';
  const inner = `${blockHead(block.title, block.subtitle, align)}<div class="cms-grid cms-cols-${block.columns ?? 3}">${items}</div>`;
  return wrapSection(block, 'none', inner);
}

function renderStats(block: Extract<ContentBlock, { type: 'stats' }>): string {
  const items = block.items
    .filter((i) => i.value?.trim() || i.label?.trim())
    .map(
      (i) =>
        `<div class="cms-stat"><span class="cms-stat__value">${esc(i.value ?? '')}</span><span class="cms-stat__label">${esc(i.label ?? '')}</span></div>`,
    )
    .join('');
  if (!items) return '';
  const inner = `${blockHead(block.title, undefined, 'center')}<div class="cms-grid cms-cols-${block.columns ?? 4}">${items}</div>`;
  return wrapSection(block, 'glass', inner);
}

function renderGallery(block: Extract<ContentBlock, { type: 'gallery' }>): string {
  const items = block.items
    .filter((i) => i.src?.trim())
    .map((i) =>
      renderMediaFigure('image', i.src, {
        alt: i.caption,
        caption: i.caption,
        ratio: block.ratio ?? 'landscape',
      }),
    )
    .join('');
  if (!items) return '';
  const inner = `${blockHead(block.title)}<div class="cms-grid cms-cols-${block.columns ?? 3}">${items}</div>`;
  return wrapSection(block, 'none', inner);
}

function renderVideoSection(block: Extract<ContentBlock, { type: 'videoSection' }>): string {
  if (!block.src?.trim()) return '';
  const inner = `${blockHead(block.title)}${renderMediaFigure('video', block.src, {
    poster: block.poster,
    caption: block.caption,
  })}`;
  return wrapSection(block, 'glass', inner, 'cms-stack');
}

function renderCta(block: Extract<ContentBlock, { type: 'cta' }>): string {
  const buttons: ButtonItem[] = [
    { label: block.buttonLabel ?? 'Оставить заявку', href: block.href || '/zakaz' },
  ];
  if (block.secondaryLabel?.trim() && block.secondaryHref?.trim()) {
    buttons.push({ label: block.secondaryLabel, href: block.secondaryHref });
  }
  const links = renderButtonLinks(buttons, true);
  const inner = `<div class="cms-card__body cms-align-center">${
    block.title?.trim() ? `<h2 class="cms-h2 cms-h2--lg">${esc(block.title)}</h2>` : ''
  }${!isEmptyRichText(block.text) ? `<div class="cms-text">${textToHtml(block.text ?? '')}</div>` : ''}${
    links ? `<div class="cms-buttons cms-buttons--center">${links}</div>` : ''
  }</div>`;
  return wrapSection(block, 'accent', inner);
}

function renderButtonsSection(block: Extract<ContentBlock, { type: 'buttons' }>): string {
  const html = renderButtons(block.items, block.align ?? 'center');
  if (!html) return '';
  return `<section class="${sectionClass(block)}">${html}</section>`;
}

function renderHero(block: Extract<ContentBlock, { type: 'hero' }>): string {
  const buttons = renderButtonLinks(block.buttons ?? [], true);
  const imageLeft = block.imagePosition === 'left';
  return `<section class="page-spaced-section max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full py-12 md:py-16">
  <div class="liquid-glass rounded-xl p-8 md:p-16 flex flex-col ${imageLeft ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center">
    <div class="flex-1 flex flex-col gap-4">
      ${block.badge ? `<div class="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 w-max"><span class="font-mono-label text-mono-label text-primary uppercase">${esc(block.badge)}</span></div>` : ''}
      <h1 class="font-headline-xl text-headline-xl text-on-surface">${esc(block.title)}</h1>
      ${block.subtitle ? `<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">${esc(block.subtitle)}</p>` : ''}
      ${buttons ? `<div class="cms-buttons">${buttons}</div>` : ''}
    </div>
    ${block.image ? `<div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden"><img src="${esc(block.image)}" alt="${esc(block.title)}" class="w-full h-full object-cover" loading="eager" decoding="async"/></div>` : ''}
  </div>
</section>`;
}

/* ---------- Старые блоки (до конструктора) ---------- */

type FlowBlock = Extract<ContentBlock, { type: 'heading' | 'text' | 'image' | 'video' | 'buttons' }>;

const FLOW_TYPES = new Set<ContentBlockType>(['heading', 'text', 'image', 'video', 'buttons']);

function isFlowBlock(block: ContentBlock): block is FlowBlock {
  return FLOW_TYPES.has(block.type);
}

function renderImageFigure(block: Extract<ContentBlock, { type: 'image' }>, extraClass = ''): string {
  if (!block.src) return '';
  return renderMediaFigure('image', block.src, { alt: block.alt, caption: block.caption, extraClass });
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
      return renderMediaFigure('video', block.src, { poster: block.poster });
    case 'buttons':
      return renderButtons(block.items, block.align ?? 'left');
  }
}

/**
 * Подряд идущие заголовки/текст/фото/видео (и кнопки после них) выводятся одной «стеклянной»
 * карточкой. Фото с положением «справа/слева» ставится рядом с текстом.
 */
function renderFlowGroup(group: FlowBlock[]): string {
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
    const cls = `cms-card cms-split cms-split--half${media.layout === 'left' ? ' cms-split--media-left' : ''}`;
    return `<section class="cms-section"><div class="${cls}"><div class="cms-card__body">${body}</div>${renderImageFigure(media, ' cms-card__media')}</div></section>`;
  }

  const inner = media ? renderImageFigure(media) : body;
  if (!inner) return '';
  return `<section class="cms-section"><div class="cms-card"><div class="cms-card__body">${inner}</div></div></section>`;
}

/** Делит список на старые «потоковые» группы и самостоятельные блоки (как при выводе на сайте) */
function groupLegacyFlow(blocks: ContentBlock[]): Array<ContentBlock | FlowBlock[]> {
  const out: Array<ContentBlock | FlowBlock[]> = [];
  let group: FlowBlock[] = [];
  const flush = () => {
    if (group.length > 0) out.push(group);
    group = [];
  };

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1) {
      flush();
      out.push(block);
      continue;
    }
    // Кнопки присоединяются к карточке только после текста/фото; сами по себе — отдельная секция
    if (isFlowBlock(block) && !(block.type === 'buttons' && group.length === 0)) {
      if (block.type === 'heading' && block.level === 2) flush();
      group.push(block);
      continue;
    }
    flush();
    out.push(block);
  }
  flush();
  return out;
}

/** HTML одного блока без группировки (превью в конструкторе, сканирование медиа) */
export function renderBlockHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'shell':
      return '';
    case 'hero':
      return renderHero(block);
    case 'heading':
      if (block.level === 1) {
        return `<section class="cms-section"><h1 class="cms-page-title">${esc(block.text)}</h1></section>`;
      }
      return renderFlowGroup([block]);
    case 'text':
    case 'image':
    case 'video':
      return renderFlowGroup([block]);
    case 'buttons':
      return renderButtonsSection(block);
    case 'html':
      if (block.raw) return block.content;
      return `<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full mb-8">${block.content}</section>`;
    case 'title':
      return renderTitle(block);
    case 'textMedia':
      return renderTextMedia(block);
    case 'cards':
      return renderCards(block);
    case 'stats':
      return renderStats(block);
    case 'gallery':
      return renderGallery(block);
    case 'videoSection':
      return renderVideoSection(block);
    case 'cta':
      return renderCta(block);
    case 'spacer':
      return `<div class="cms-spacer cms-spacer--${block.size ?? 'm'}" aria-hidden="true"></div>`;
    default:
      return '';
  }
}

function renderBlockList(blocks: ContentBlock[]): string {
  return groupLegacyFlow(blocks)
    .map((entry) => (Array.isArray(entry) ? renderFlowGroup(entry) : renderBlockHtml(entry)))
    .filter(Boolean)
    .join('\n');
}

export const DEFAULT_MAIN_CLASS = 'flex-grow pt-32 md:pt-40 w-full flex flex-col gap-gutter pb-24';

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

  return `<main class="${DEFAULT_MAIN_CLASS}">${inner}</main>`;
}

/**
 * Старые блоки (заголовок/текст/фото/видео подряд) → секции конструктора «Текст + фото»
 * с тем же видом на сайте.
 */
export function migrateLegacyBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return groupLegacyFlow(blocks).map((entry) => {
    if (!Array.isArray(entry)) {
      if (entry.type === 'heading' && entry.level === 1) {
        return { id: entry.id, type: 'title', text: entry.text, size: 'page', align: 'center' };
      }
      return entry;
    }
    return flowGroupToTextMedia(entry);
  });
}

function flowGroupToTextMedia(group: FlowBlock[]): ContentBlock {
  const rest = [...group];
  let title: string | undefined;
  let subtitle: string | undefined;
  if (rest[0]?.type === 'heading' && rest[0].level === 2) title = (rest.shift() as { text: string }).text;
  if (rest[0]?.type === 'heading' && rest[0].level === 3) subtitle = (rest.shift() as { text: string }).text;

  let media: { kind: 'image' | 'video'; src: string; alt?: string; caption?: string; position: 'right' | 'left' | 'top' | 'bottom' } | null =
    null;
  const split = rest.find(
    (b): b is Extract<FlowBlock, { type: 'image' }> =>
      b.type === 'image' && Boolean(b.src) && (b.layout === 'right' || b.layout === 'left'),
  );
  if (split) {
    media = { kind: 'image', src: split.src, alt: split.alt, caption: split.caption, position: split.layout as 'right' | 'left' };
    rest.splice(rest.indexOf(split), 1);
  } else {
    const nonButtons = rest.filter((b) => b.type !== 'buttons');
    const first = nonButtons[0];
    const last = nonButtons[nonButtons.length - 1];
    const pick = (b: FlowBlock | undefined, position: 'top' | 'bottom') => {
      if (b?.type === 'image' && b.src) {
        media = { kind: 'image', src: b.src, alt: b.alt, caption: b.caption, position };
      } else if (b?.type === 'video' && b.src) {
        media = { kind: 'video', src: b.src, position };
      } else {
        return false;
      }
      rest.splice(rest.indexOf(b), 1);
      return true;
    };
    if (!pick(last, 'bottom')) pick(first, 'top');
  }

  const buttons = rest.flatMap((b) => (b.type === 'buttons' ? b.items : []));
  const text = rest
    .filter((b) => b.type !== 'buttons')
    .map((b) => {
      if (b.type === 'heading') return b.level === 3 ? `<h3>${esc(b.text)}</h3>` : `<h2>${esc(b.text)}</h2>`;
      if (b.type === 'text') return textToHtml(b.content);
      return renderFlowItem(b);
    })
    .join('');

  const m = media as typeof media;
  return {
    id: group[0].id,
    type: 'textMedia',
    title,
    subtitle,
    text,
    mediaType: m ? m.kind : 'none',
    image: m?.kind === 'image' ? m.src : '',
    video: m?.kind === 'video' ? m.src : '',
    alt: m?.alt ?? '',
    caption: m?.caption ?? '',
    mediaPosition: m?.position ?? 'right',
    mediaSize: 'half',
    mediaRatio: 'auto',
    verticalAlign: 'center',
    textAlign: 'left',
    buttons,
    background: 'glass',
  };
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
      type: 'textMedia',
      title: 'О направлении',
      text: '<p>Текст страницы. Добавляйте и перетаскивайте блоки в конструкторе.</p>',
      mediaType: 'none',
      background: 'glass',
    },
  ];
}
