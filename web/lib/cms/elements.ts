/**
 * Элементы и контейнеры конструктора: заголовок, текст, кнопка, фото, … секция, колонки, группа.
 * Вывод — HTML-строка (тот же код рисует сайт и холст редактора). Стили — styles/cms-elements.css.
 */
import type { ContentBlock } from '@/lib/cms/content-blocks';

/* ---------- Палитра сайта ---------- */

export type PaletteKey =
  | 'primary'
  | 'primaryBright'
  | 'primaryLight'
  | 'deepBlue'
  | 'text'
  | 'muted'
  | 'grey'
  | 'slate'
  | 'surfaceBright'
  | 'surfaceHigh'
  | 'surface'
  | 'background'
  | 'red'
  | 'white';

/** hex — сам цвет, on — читаемый текст поверх него */
export const PALETTE: { key: PaletteKey; label: string; hex: string; on: string }[] = [
  { key: 'primary', label: 'Голубой (фирменный)', hex: '#adc6ff', on: '#002e6a' },
  { key: 'primaryBright', label: 'Синий яркий', hex: '#4d8eff', on: '#001a42' },
  { key: 'primaryLight', label: 'Светло-голубой', hex: '#d8e2ff', on: '#002e6a' },
  { key: 'deepBlue', label: 'Тёмно-синий', hex: '#002e6a', on: '#d8e2ff' },
  { key: 'text', label: 'Светлый (заголовки)', hex: '#d4e4fa', on: '#051424' },
  { key: 'muted', label: 'Серо-голубой (текст)', hex: '#c2c6d6', on: '#051424' },
  { key: 'grey', label: 'Серый', hex: '#8c909f', on: '#051424' },
  { key: 'slate', label: 'Графит', hex: '#3f465c', on: '#d4e4fa' },
  { key: 'surfaceBright', label: 'Тёмно-серый', hex: '#2c3a4c', on: '#d4e4fa' },
  { key: 'surfaceHigh', label: 'Тёмный', hex: '#1c2b3c', on: '#d4e4fa' },
  { key: 'surface', label: 'Очень тёмный', hex: '#122131', on: '#d4e4fa' },
  { key: 'background', label: 'Фон сайта', hex: '#051424', on: '#d4e4fa' },
  { key: 'red', label: 'Красный акцент', hex: '#ffb4ab', on: '#690005' },
  { key: 'white', label: 'Белый', hex: '#ffffff', on: '#051424' },
];

const PALETTE_MAP = new Map(PALETTE.map((c) => [c.key, c]));

function paletteColor(key: string | undefined) {
  return key ? PALETTE_MAP.get(key as PaletteKey) : undefined;
}

/** --tone / --tone-on для кнопок, иконок, плашек */
function toneCss(key: string | undefined, fallback: PaletteKey = 'primary'): string[] {
  const c = paletteColor(key) ?? PALETTE_MAP.get(fallback)!;
  return [`--tone:${c.hex}`, `--tone-on:${c.on}`];
}

/* ---------- Оформление (общие настройки любого элемента) ---------- */

export type Space = 'none' | 'xs' | 's' | 'm' | 'l' | 'xl';
export type Align = 'left' | 'center' | 'right' | 'stretch';

export type ElementStyle = {
  align?: Align | '';
  alignMobile?: Align | '';
  mt?: Space;
  mb?: Space;
  pad?: Space;
  bg?: 'none' | 'glass' | 'accent' | PaletteKey;
  color?: '' | PaletteKey;
  radius?: '' | 'none' | 's' | 'm' | 'l' | 'full';
  border?: 'none' | 'thin' | 'thick';
  borderColor?: '' | PaletteKey;
  shadow?: 'none' | 's' | 'l' | 'glow';
  maxWidth?: 'none' | 'xs' | 's' | 'm' | 'l';
  hide?: 'none' | 'mobile' | 'desktop';
};

const SPACES = new Set(['xs', 's', 'm', 'l', 'xl']);
const ALIGNS = new Set(['left', 'center', 'right', 'stretch']);

export type Parts = { cls: string[]; css: string[] };

/** Части стиля: box — фон/рамка/отступы внутри, outer — положение и внешние отступы */
function styleParts(style: ElementStyle | undefined, only?: 'outer' | 'box'): Parts {
  const s = style ?? {};
  const cls: string[] = [];
  const css: string[] = [];
  if (only !== 'box') {
    if (s.align && ALIGNS.has(s.align)) cls.push(`cmsx-al-${s.align}`);
    if (s.alignMobile && ALIGNS.has(s.alignMobile)) cls.push(`cmsx-mal-${s.alignMobile}`);
    if (s.mt && SPACES.has(s.mt)) cls.push(`cmsx-mt-${s.mt}`);
    if (s.mb && SPACES.has(s.mb)) cls.push(`cmsx-mb-${s.mb}`);
    if (s.maxWidth && ['xs', 's', 'm', 'l'].includes(s.maxWidth)) cls.push(`cmsx-mw-${s.maxWidth}`);
    if (s.hide === 'mobile' || s.hide === 'desktop') cls.push(`cmsx-hide-${s.hide}`);
  }
  if (only !== 'outer') {
    if (s.pad && SPACES.has(s.pad)) cls.push(`cmsx-p-${s.pad}`);
    if (s.bg === 'glass') cls.push('cmsx-glass');
    else if (s.bg === 'accent') cls.push('cmsx-accent');
    else {
      const bg = paletteColor(s.bg);
      if (bg) {
        cls.push('cmsx-has-bg');
        css.push(`background-color:${bg.hex}`);
      }
    }
    const color = paletteColor(s.color);
    if (color) css.push(`color:${color.hex}`);
    if (s.radius && ['none', 's', 'm', 'l', 'full'].includes(s.radius)) cls.push(`cmsx-r-${s.radius}`);
    if (s.border === 'thin' || s.border === 'thick') {
      cls.push(`cmsx-bd-${s.border}`);
      const bc = paletteColor(s.borderColor);
      if (bc) css.push(`border-color:${bc.hex}`);
    }
    if (s.shadow && ['s', 'l', 'glow'].includes(s.shadow)) cls.push(`cmsx-sh-${s.shadow}`);
  }
  return { cls, css };
}

/* ---------- Типы элементов ---------- */

export type ButtonVariant = 'filled' | 'outline' | 'soft' | 'glass' | 'link' | 'arrow' | 'icon';
export type ButtonLook = {
  variant?: ButtonVariant;
  shape?: 'square' | 'rounded' | 'pill';
  size?: 's' | 'm' | 'l';
  tone?: PaletteKey;
  /** 'auto' — стрелка, для PDF — значок презентации; '' — без иконки */
  icon?: string;
  iconPosition?: 'left' | 'right';
  upper?: 'yes' | 'no';
};

export type MediaRatioX = 'auto' | '16-9' | '4-3' | '1-1' | '3-4';
export type MediaSize = 'full' | 'l' | 'm' | 's' | 'xs';

export type LayoutProps = {
  direction?: 'col' | 'row';
  gap?: Space;
  justify?: 'start' | 'center' | 'end' | 'between';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: 'yes' | 'no';
  mobileStack?: 'yes' | 'no';
};

type WithStyle = { style?: ElementStyle };

export type ElementBlock =
  | ({
      id: string;
      type: 'elHeading';
      text: string;
      level?: 1 | 2 | 3 | 4;
      size?: 'xl' | 'l' | 'm' | 's' | 'xs';
      weight?: 'normal' | 'medium' | 'semibold' | 'bold';
      upper?: 'yes' | 'no';
    } & WithStyle)
  | ({ id: string; type: 'elText'; text: string; size?: 's' | 'm' | 'l' | 'xl' } & WithStyle)
  | ({ id: string; type: 'elButton'; label: string; href: string } & ButtonLook & WithStyle)
  | ({
      id: string;
      type: 'elImage';
      src: string;
      alt?: string;
      caption?: string;
      href?: string;
      ratio?: MediaRatioX;
      fit?: 'cover' | 'contain';
      rounded?: 'none' | 's' | 'm' | 'l';
      size?: MediaSize;
    } & WithStyle)
  | ({
      id: string;
      type: 'elVideo';
      src: string;
      poster?: string;
      caption?: string;
      ratio?: MediaRatioX;
      rounded?: 'none' | 's' | 'm' | 'l';
      size?: MediaSize;
      autoplay?: 'yes' | 'no';
    } & WithStyle)
  | ({
      id: string;
      type: 'elIcon';
      icon: string;
      size?: 's' | 'm' | 'l' | 'xl';
      tone?: PaletteKey;
      background?: 'none' | 'soft' | 'filled' | 'outline';
      fill?: 'yes' | 'no';
      /** Для своей иконки: перекрашивать в выбранный цвет */
      recolor?: 'yes' | 'no';
    } & WithStyle)
  | ({
      id: string;
      type: 'elBadge';
      text: string;
      tone?: PaletteKey;
      variant?: 'soft' | 'outline' | 'filled';
      dot?: 'yes' | 'no';
    } & WithStyle)
  | ({
      id: string;
      type: 'elList';
      items: { text: string }[];
      marker?: 'dot' | 'check' | 'arrow' | 'dash' | 'number' | 'none';
      tone?: PaletteKey;
      size?: 's' | 'm' | 'l';
      gap?: 's' | 'm' | 'l';
    } & WithStyle)
  | ({
      id: string;
      type: 'elDivider';
      thickness?: 'thin' | 'medium' | 'thick';
      length?: 'full' | 'half' | 'short';
      lineStyle?: 'solid' | 'dashed';
      tone?: PaletteKey | '';
    } & WithStyle)
  | ({ id: string; type: 'elGroup'; content: ContentBlock[] } & LayoutProps & WithStyle)
  | ({ id: string; type: 'elSection'; content: ContentBlock[]; width?: 'narrow' | 'normal' | 'wide' } & LayoutProps &
      WithStyle)
  | ({
      id: string;
      type: 'elColumns';
      count?: 2 | 3 | 4;
      ratio?: string;
      gap?: Space;
      valign?: 'start' | 'center' | 'end' | 'stretch';
      mobile?: 'stack' | 'reverse' | 'keep';
      col1?: ContentBlock[];
      col2?: ContentBlock[];
      col3?: ContentBlock[];
      col4?: ContentBlock[];
    } & WithStyle);

export type ElementType = ElementBlock['type'];

export const ELEMENT_TYPES = new Set<string>([
  'elHeading',
  'elText',
  'elButton',
  'elImage',
  'elVideo',
  'elIcon',
  'elBadge',
  'elList',
  'elDivider',
  'elGroup',
  'elSection',
  'elColumns',
]);

/** Поля-зоны, куда вкладываются другие блоки */
export const SLOT_PROPS: Record<string, string[]> = {
  box: ['content'],
  elGroup: ['content'],
  elSection: ['content'],
  elColumns: ['col1', 'col2', 'col3', 'col4'],
};

/* ---------- Вывод ---------- */

function esc(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHref(href: string): string {
  const value = String(href ?? '').trim();
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value) ? value : '#';
}

function isDocumentHref(href: string): boolean {
  return /\.pdf(\?|#|$)/i.test(href);
}

function linkAttrs(href: string): string {
  const safe = safeHref(href);
  const external = isDocumentHref(safe) || /^https?:\/\//i.test(safe);
  return ` href="${esc(safe)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}`;
}

function attrs(cls: string[], css: string[]): string {
  const c = cls.filter(Boolean).join(' ');
  return `${c ? ` class="${c}"` : ''}${css.length ? ` style="${esc(css.join(';'))}"` : ''}`;
}

function merge(...parts: Parts[]): Parts {
  return { cls: parts.flatMap((p) => p.cls), css: parts.flatMap((p) => p.css) };
}

function textToHtml(content: string): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function isEmptyRichText(html: string | undefined): boolean {
  return !html || !html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** Своя иконка — ссылка на загруженную картинку, иначе название из Material Symbols */
export function isIconUrl(value: string | undefined): boolean {
  return /^(\/|https?:\/\/)[^\s"'()<>\\]+$/i.test(String(value ?? '').trim());
}

/**
 * HTML иконки. Своя картинка по умолчанию перекрашивается в цвет текста (маска),
 * recolor=false — показывается в исходных цветах.
 */
export function renderIconHtml(value: string, extraCls = '', css = '', recolor = true): string {
  const name = String(value ?? '').trim();
  if (isIconUrl(name)) {
    const url = esc(name);
    const inner = recolor
      ? `<span class="cmsx-icon-img cmsx-icon-mask" style="-webkit-mask-image:url('${url}');mask-image:url('${url}')"></span>`
      : `<img class="cmsx-icon-img" src="${url}" alt="" loading="lazy" decoding="async"/>`;
    return `<span class="cmsx-icon-custom${extraCls ? ` ${extraCls}` : ''}"${css ? ` style="${esc(css)}"` : ''} aria-hidden="true">${inner}</span>`;
  }
  const clean = name.replace(/[^a-z0-9_]/gi, '');
  if (!clean) return '';
  return `<span class="material-symbols-outlined${extraCls ? ` ${extraCls}` : ''}"${
    css ? ` style="${esc(css)}"` : ''
  } aria-hidden="true">${clean}</span>`;
}

const iconSpan = renderIconHtml;

/* ---------- Свободное размещение ---------- */

/** Положение внутри контейнера: x — % ширины, y — px от верха; mobile=flow — на телефоне в общем потоке */
export type Place = { x: number; y: number; mobile?: 'flow' | 'keep' };

/** Типы, которые можно размещать свободно (внутри страницы и контейнеров) */
export const PLACEABLE_TYPES = new Set<string>([...ELEMENT_TYPES, 'box', 'html']);

export function isPlace(value: unknown): value is Place {
  const p = value as Place | null | undefined;
  return !!p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y);
}

export function placeParts(place: unknown): Parts {
  if (!isPlace(place)) return { cls: [], css: [] };
  const x = Math.round(Math.min(100, Math.max(-50, place.x)) * 100) / 100;
  const y = Math.round(place.y);
  return {
    cls: ['cmsx-free', place.mobile === 'keep' ? 'cmsx-free-keep' : ''].filter(Boolean),
    css: [`left:${x}%`, `top:${y}px`],
  };
}

const OPEN_TAG_RE = /^<([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/;

/** Добавляет классы и стили в первый тег HTML (комментарии и пробелы в начале пропускаются) */
export function addRootAttrs(html: string, parts: Parts): string {
  const cls = parts.cls.filter(Boolean).join(' ');
  const css = parts.css.join(';');
  if (!cls && !css) return html;
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) return html;
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      if (end === -1) return html;
      i = end + 3;
      continue;
    }
    const m = OPEN_TAG_RE.exec(html.slice(lt));
    if (!m) return html;
    let attrs = m[2] ?? '';
    if (cls) {
      const re = /(\sclass\s*=\s*)(?:"([^"]*)"|'([^']*)')/i;
      attrs = re.test(attrs)
        ? attrs.replace(re, (_, pre: string, d?: string, s?: string) =>
            d !== undefined ? `${pre}"${`${d} ${cls}`.trim()}"` : `${pre}'${`${s ?? ''} ${cls}`.trim()}'`,
          )
        : `${attrs} class="${cls}"`;
    }
    if (css) {
      const re = /(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/i;
      const join = (v: string) => {
        const t = v.trim();
        return t ? `${t}${t.endsWith(';') ? '' : ';'}${css}` : css;
      };
      attrs = re.test(attrs)
        ? attrs.replace(re, (_, pre: string, d?: string, s?: string) =>
            d !== undefined ? `${pre}"${join(d)}"` : `${pre}'${join(s ?? '')}'`,
          )
        : `${attrs} style="${esc(css)}"`;
    }
    return `${html.slice(0, lt)}<${m[1]}${attrs}${m[3] ? ' /' : ''}>${html.slice(lt + m[0].length)}`;
  }
  return html;
}

/** Размер, заданный уголком на холсте (px); не заданная сторона — по содержимому */
export type Dims = { w?: number; h?: number };

const dimValue = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(Math.min(v, 4000)) : 0);

export function isDims(value: unknown): value is Dims {
  const d = value as Dims | null | undefined;
  return !!d && typeof d === 'object' && (dimValue(d.w) > 0 || dimValue(d.h) > 0);
}

export function dimsParts(dims: unknown): Parts {
  if (!isDims(dims)) return { cls: [], css: [] };
  const w = dimValue(dims.w);
  const h = dimValue(dims.h);
  return {
    cls: [w ? 'cmsx-dw' : '', h ? 'cmsx-dh' : ''].filter(Boolean),
    css: [w ? `--cmsx-w:${w}px` : '', h ? `--cmsx-h:${h}px` : ''].filter(Boolean),
  };
}

/** Положение и размер одним набором классов/стилей для корня элемента */
export function freeParts(place: unknown, dims: unknown): Parts {
  const p = placeParts(place);
  const d = dimsParts(dims);
  return { cls: [...p.cls, ...d.cls], css: [...p.css, ...d.css] };
}

export function applyPlace(html: string, place: unknown, dims?: unknown): string {
  return isPlace(place) || isDims(dims) ? addRootAttrs(html, freeParts(place, dims)) : html;
}

/** Ссылка-кнопка по настройкам вида; используется элементом «Кнопка» и блоком «Кнопки / презентации» */
export function renderButtonHtml(label: string, href: string, look: ButtonLook): string {
  const variant = look.variant ?? 'filled';
  const pdf = isDocumentHref(href ?? '');
  let icon = look.icon ?? 'auto';
  if (icon === 'auto') icon = variant === 'link' ? '' : pdf && variant !== 'arrow' ? 'present_to_all' : 'arrow_forward';
  if (variant === 'icon' && !icon) icon = 'arrow_forward';
  const position = look.iconPosition ?? (pdf && variant !== 'arrow' ? 'left' : 'right');
  const cls = [
    'cmsx-btn',
    `cmsx-btn--${variant}`,
    `cmsx-shape-${look.shape ?? 'pill'}`,
    `cmsx-size-${look.size ?? 'm'}`,
    look.upper === 'no' ? '' : 'cmsx-upper',
  ];
  const iconHtml = icon ? iconSpan(icon) : '';
  const text = variant === 'icon' ? '' : `<span>${esc(label)}</span>`;
  const inner = position === 'left' ? `${iconHtml}${text}` : `${text}${iconHtml}`;
  const aria = variant === 'icon' ? ` aria-label="${esc(label)}" title="${esc(label)}"` : '';
  return `<a${attrs(cls, toneCss(look.tone))}${linkAttrs(href)}${aria}>${inner}</a>`;
}

function layoutParts(p: LayoutProps, defaults: Partial<LayoutProps> = {}): Parts {
  const direction = p.direction ?? defaults.direction ?? 'col';
  const cls = ['cmsx-group', `cmsx-dir-${direction}`];
  const gap = p.gap ?? defaults.gap ?? 'm';
  cls.push(`cmsx-gap-${gap}`);
  const justify = p.justify ?? defaults.justify;
  if (justify && justify !== 'start') cls.push(`cmsx-jc-${justify}`);
  const alignItems = p.alignItems ?? defaults.alignItems;
  if (alignItems) cls.push(`cmsx-ai-${alignItems}`);
  if ((p.wrap ?? defaults.wrap) === 'yes') cls.push('cmsx-wrap');
  if (direction === 'row' && (p.mobileStack ?? defaults.mobileStack ?? 'yes') === 'yes') cls.push('cmsx-mstack');
  return { cls, css: [] };
}

const COLUMN_RATIOS: Record<string, string> = {
  equal: '',
  '1-2': 'minmax(0,1fr) minmax(0,2fr)',
  '2-1': 'minmax(0,2fr) minmax(0,1fr)',
  '1-3': 'minmax(0,1fr) minmax(0,3fr)',
  '3-1': 'minmax(0,3fr) minmax(0,1fr)',
  '1-2-1': 'minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)',
  '2-1-1': 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)',
  '1-1-2': 'minmax(0,1fr) minmax(0,1fr) minmax(0,2fr)',
};

export function columnsTemplate(count: number, ratio: string | undefined): string {
  const custom = ratio ? COLUMN_RATIOS[ratio] : '';
  if (custom && custom.split(' ').length === count) return custom;
  return `repeat(${count},minmax(0,1fr))`;
}

/** Классы/стили контейнеров — нужны и HTML-выводу, и холсту редактора (там зона вложения — сам контейнер) */
export function containerParts(block: ElementBlock): {
  outer: Parts;
  inner: Parts;
  cols?: number;
} {
  switch (block.type) {
    case 'elGroup':
      return { outer: merge({ cls: ['cmsx-el'], css: [] }, layoutParts(block), styleParts(block.style)), inner: { cls: [], css: [] } };
    case 'elSection': {
      const outerCls = ['cms-section', 'cmsx-el', 'cmsx-section'];
      if (block.width === 'narrow') outerCls.push('cms-w-narrow');
      if (block.width === 'wide') outerCls.push('cms-w-wide');
      return {
        outer: merge({ cls: outerCls, css: [] }, styleParts(block.style, 'outer')),
        inner: merge(layoutParts(block), styleParts(block.style, 'box')),
      };
    }
    case 'elColumns': {
      const count = [2, 3, 4].includes(Number(block.count)) ? Number(block.count) : 2;
      const cls = [
        'cmsx-el',
        'cmsx-columns',
        `cmsx-gap-${block.gap ?? 'l'}`,
        `cmsx-va-${block.valign ?? 'start'}`,
        `cmsx-mobile-${block.mobile ?? 'stack'}`,
      ];
      return {
        outer: merge({ cls, css: [`--cmsx-cols:${columnsTemplate(count, block.ratio)}`] }, styleParts(block.style)),
        inner: { cls: ['cmsx-col'], css: [] },
        cols: count,
      };
    }
    default:
      return { outer: { cls: [], css: [] }, inner: { cls: [], css: [] } };
  }
}

function mediaBox(inner: string, href: string | undefined, sizeCls: string): string {
  return href?.trim()
    ? `<a class="cmsx-media ${sizeCls}"${linkAttrs(href)}>${inner}</a>`
    : `<div class="cmsx-media ${sizeCls}">${inner}</div>`;
}

function videoEmbed(src: string): string | null {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i.exec(src);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(src);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const rutube = /rutube\.ru\/(?:video|play\/embed)\/([\w]+)/i.exec(src);
  if (rutube) return `https://rutube.ru/play/embed/${rutube[1]}`;
  return null;
}

/** HTML элемента; renderChild — вывод вложенных блоков (для контейнеров) */
export function renderElementHtml(block: ElementBlock, renderChild: (b: ContentBlock) => string): string {
  const base = (extra: string[] = []) => merge({ cls: ['cmsx-el', ...extra], css: [] }, styleParts(block.style));

  switch (block.type) {
    case 'elHeading': {
      if (!block.text?.trim()) return '';
      const level = [1, 2, 3, 4].includes(Number(block.level)) ? Number(block.level) : 2;
      const p = base([
        'cmsx-heading',
        `cmsx-hs-${block.size ?? 'l'}`,
        block.weight && block.weight !== 'semibold' ? `cmsx-fw-${block.weight}` : '',
        block.upper === 'yes' ? 'cmsx-upper' : '',
      ]);
      return `<h${level}${attrs(p.cls, p.css)}>${esc(block.text).replace(/\n/g, '<br>')}</h${level}>`;
    }
    case 'elText': {
      if (isEmptyRichText(block.text)) return '';
      const p = base(['cms-text', 'cmsx-text', `cmsx-ts-${block.size ?? 'm'}`]);
      return `<div${attrs(p.cls, p.css)}>${textToHtml(block.text ?? '')}</div>`;
    }
    case 'elButton': {
      if (!block.label?.trim()) return '';
      const p = base(['cmsx-place']);
      return `<div${attrs(p.cls, p.css)}>${renderButtonHtml(block.label, block.href ?? '', block)}</div>`;
    }
    case 'elImage': {
      if (!block.src?.trim()) return '';
      const p = base(['cmsx-place', 'cmsx-image']);
      const imgCls = [
        'cmsx-img',
        block.ratio && block.ratio !== 'auto' ? `cmsx-ar-${block.ratio}` : '',
        block.fit === 'contain' ? 'cmsx-fit-contain' : '',
        `cmsx-ir-${block.rounded ?? 'm'}`,
      ]
        .filter(Boolean)
        .join(' ');
      const img = `<img class="${imgCls}" src="${esc(block.src)}" alt="${esc(block.alt ?? '')}" loading="lazy" decoding="async"/>`;
      const caption = block.caption?.trim() ? `<figcaption>${esc(block.caption)}</figcaption>` : '';
      return `<figure${attrs(p.cls, p.css)}>${mediaBox(img, block.href, `cmsx-iw-${block.size ?? 'full'}`)}${caption}</figure>`;
    }
    case 'elVideo': {
      if (!block.src?.trim()) return '';
      const p = base(['cmsx-place', 'cmsx-image']);
      const ratio = block.ratio && block.ratio !== 'auto' ? block.ratio : '16-9';
      const cls = `cmsx-img cmsx-ar-${ratio} cmsx-ir-${block.rounded ?? 'm'}`;
      const embed = videoEmbed(block.src);
      const media = embed
        ? `<iframe class="${cls}" src="${esc(embed)}" title="Видео" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`
        : `<video class="${cls}" src="${esc(block.src)}"${block.poster ? ` poster="${esc(block.poster)}"` : ''}${
            block.autoplay === 'yes' ? ' autoplay muted loop playsinline' : ' controls playsinline'
          } preload="metadata"></video>`;
      const caption = block.caption?.trim() ? `<figcaption>${esc(block.caption)}</figcaption>` : '';
      return `<figure${attrs(p.cls, p.css)}>${mediaBox(media, undefined, `cmsx-iw-${block.size ?? 'full'}`)}${caption}</figure>`;
    }
    case 'elIcon': {
      if (!block.icon?.trim()) return '';
      const p = base(['cmsx-place']);
      const iconCls = `cmsx-icon cmsx-is-${block.size ?? 'm'} cmsx-ib-${block.background ?? 'none'}`;
      const css = [...toneCss(block.tone), ...(block.fill === 'yes' ? ["font-variation-settings:'FILL' 1"] : [])].join(';');
      return `<div${attrs(p.cls, p.css)}>${renderIconHtml(block.icon, iconCls, css, block.recolor !== 'no')}</div>`;
    }
    case 'elBadge': {
      if (!block.text?.trim()) return '';
      const p = base(['cmsx-place']);
      const dot = block.dot === 'yes' ? '<span class="cmsx-badge__dot" aria-hidden="true"></span>' : '';
      return `<div${attrs(p.cls, p.css)}><span${attrs(
        ['cmsx-badge', `cmsx-badge--${block.variant ?? 'soft'}`],
        toneCss(block.tone),
      )}>${dot}${esc(block.text)}</span></div>`;
    }
    case 'elList': {
      const items = (block.items ?? []).filter((i) => i?.text?.trim());
      if (!items.length) return '';
      const marker = block.marker ?? 'check';
      const p = merge(base(['cmsx-list', `cmsx-ts-${block.size ?? 'm'}`, `cmsx-list-gap-${block.gap ?? 'm'}`]), {
        cls: [],
        css: toneCss(block.tone),
      });
      const tag = marker === 'number' ? 'ol' : 'ul';
      const li = items
        .map((item, index) => {
          let mark = '';
          if (marker === 'check') mark = iconSpan('check_circle', 'cmsx-list__mark');
          else if (marker === 'arrow') mark = iconSpan('arrow_forward', 'cmsx-list__mark');
          else if (marker === 'dot') mark = '<span class="cmsx-list__dot" aria-hidden="true"></span>';
          else if (marker === 'dash') mark = '<span class="cmsx-list__dash" aria-hidden="true"></span>';
          else if (marker === 'number') mark = `<span class="cmsx-list__num" aria-hidden="true">${index + 1}</span>`;
          return `<li>${mark}<span>${esc(item.text).replace(/\n/g, '<br>')}</span></li>`;
        })
        .join('');
      return `<${tag}${attrs(p.cls, p.css)}>${li}</${tag}>`;
    }
    case 'elDivider': {
      const p = base(['cmsx-place']);
      const color = paletteColor(block.tone || undefined);
      const hrCls = [
        'cmsx-hr',
        `cmsx-hr--${block.thickness ?? 'thin'}`,
        `cmsx-hr-len-${block.length ?? 'full'}`,
        block.lineStyle === 'dashed' ? 'cmsx-hr--dashed' : '',
      ];
      return `<div${attrs(p.cls, p.css)}><hr${attrs(hrCls, color ? [`border-color:${color.hex}`] : [])}/></div>`;
    }
    case 'elGroup': {
      const { outer } = containerParts(block);
      return `<div${attrs(outer.cls, outer.css)}>${(block.content ?? []).map(renderChild).join('')}</div>`;
    }
    case 'elSection': {
      const { outer, inner } = containerParts(block);
      return `<section${attrs(outer.cls, outer.css)}><div${attrs(inner.cls, inner.css)}>${(block.content ?? [])
        .map(renderChild)
        .join('')}</div></section>`;
    }
    case 'elColumns': {
      const { outer, inner, cols = 2 } = containerParts(block);
      const columns = [block.col1, block.col2, block.col3, block.col4]
        .slice(0, cols)
        .map((col) => `<div${attrs(inner.cls, inner.css)}>${(col ?? []).map(renderChild).join('')}</div>`)
        .join('');
      return `<div${attrs(outer.cls, outer.css)}>${columns}</div>`;
    }
    default:
      return '';
  }
}

/** Для холста: class и style-объект из частей */
export function partsToReact(parts: Parts): { className: string; style: Record<string, string> } {
  const style: Record<string, string> = {};
  for (const decl of parts.css) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[key] = value;
  }
  return { className: parts.cls.filter(Boolean).join(' '), style };
}
