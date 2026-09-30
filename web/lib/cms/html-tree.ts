/**
 * Разбор HTML-секции сайта на дерево «контейнер → элементы» для конструктора.
 * Разбор без DOM: каждый узел хранит точные куски исходной строки, поэтому
 * обратная сборка (renderBlockHtml) даёт тот же HTML символ в символ.
 */
import type { ContentBlock } from '@/lib/cms/content-blocks';

type ElementNode = {
  kind: 'element';
  tag: string;
  start: number;
  openEnd: number;
  closeStart: number;
  end: number;
  children: HtmlNode[];
};

export type HtmlNode = ElementNode | { kind: 'text' | 'comment'; start: number; end: number };

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
const RAW_TAGS = new Set(['script', 'style', 'textarea', 'title']);

/** null — разметка не сбалансирована (незакрытые/лишние теги): такую секцию не разбираем */
export function parseHtml(html: string): HtmlNode[] | null {
  const root: HtmlNode[] = [];
  const stack: ElementNode[] = [];
  const push = (node: HtmlNode) => (stack.length ? stack[stack.length - 1].children : root).push(node);
  const len = html.length;
  let i = 0;

  while (i < len) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      push({ kind: 'text', start: i, end: len });
      break;
    }
    if (lt > i) push({ kind: 'text', start: i, end: lt });

    if (html.startsWith('<!--', lt)) {
      const close = html.indexOf('-->', lt + 4);
      if (close === -1) return null;
      push({ kind: 'comment', start: lt, end: close + 3 });
      i = close + 3;
      continue;
    }

    const next = html[lt + 1] ?? '';
    if (next === '/') {
      const m = /^<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/.exec(html.slice(lt, lt + 80));
      if (!m) return null;
      const top = stack[stack.length - 1];
      if (!top || top.tag !== m[1].toLowerCase()) return null;
      top.closeStart = lt;
      top.end = lt + m[0].length;
      stack.pop();
      i = top.end;
      continue;
    }

    if (next === '!' || next === '?') {
      const close = html.indexOf('>', lt);
      if (close === -1) return null;
      push({ kind: 'comment', start: lt, end: close + 1 });
      i = close + 1;
      continue;
    }

    if (!/[a-zA-Z]/.test(next)) {
      push({ kind: 'text', start: lt, end: lt + 1 });
      i = lt + 1;
      continue;
    }

    const name = /^[a-zA-Z][a-zA-Z0-9:-]*/.exec(html.slice(lt + 1, lt + 64));
    if (!name) return null;
    const tag = name[0].toLowerCase();
    let j = lt + 1 + name[0].length;
    let selfClosing = false;
    for (;;) {
      if (j >= len) return null;
      const c = html[j];
      if (c === '>') {
        j += 1;
        break;
      }
      if (c === '/' && html[j + 1] === '>') {
        selfClosing = true;
        j += 2;
        break;
      }
      if (c === '"' || c === "'") {
        const q = html.indexOf(c, j + 1);
        if (q === -1) return null;
        j = q + 1;
        continue;
      }
      j += 1;
    }

    const el: ElementNode = { kind: 'element', tag, start: lt, openEnd: j, closeStart: j, end: j, children: [] };
    if (VOID_TAGS.has(tag) || selfClosing) {
      push(el);
      i = j;
      continue;
    }
    if (RAW_TAGS.has(tag)) {
      const m = new RegExp(`</${tag}\\s*>`, 'i').exec(html.slice(j));
      if (!m) return null;
      el.closeStart = j + m.index;
      el.end = el.closeStart + m[0].length;
      if (m.index > 0) el.children.push({ kind: 'text', start: j, end: el.closeStart });
      push(el);
      i = el.end;
      continue;
    }
    push(el);
    stack.push(el);
    i = j;
  }

  return stack.length ? null : root;
}

/* ---------- Разбиение секции ---------- */

const CONTAINER_TAGS = new Set(['section', 'div', 'article', 'aside', 'header', 'footer', 'nav', 'main']);
/** Строчные теги: контейнер только из них (например, плашка «точка + текст») — один элемент */
const PHRASING_TAGS = new Set([
  'span', 'strong', 'b', 'em', 'i', 'small', 'br', 'sup', 'sub', 'u', 's', 'mark', 'abbr', 'time', 'code', 'label', 'wbr',
]);
const MAX_DEPTH = 6;
const MAX_CHILDREN = 40;
/** Не больше узлов на секцию — чтобы огромные каталоги не тормозили редактор */
const NODE_BUDGET = 150;

function elementChildren(el: ElementNode): ElementNode[] {
  return el.children.filter((c): c is ElementNode => c.kind === 'element');
}

function hasDirectText(html: string, el: ElementNode): boolean {
  return el.children.some((c) => c.kind === 'text' && html.slice(c.start, c.end).trim() !== '');
}

function splittable(html: string, el: ElementNode, depth: number): boolean {
  if (!CONTAINER_TAGS.has(el.tag) || depth > MAX_DEPTH) return false;
  if (hasDirectText(html, el)) return false;
  const kids = elementChildren(el);
  if (kids.length === 0 || kids.length > MAX_CHILDREN) return false;
  if (kids.length === 1) return splittable(html, kids[0], depth + 1);
  return kids.some((k) => !PHRASING_TAGS.has(k.tag));
}

function plainText(fragment: string): string {
  return fragment
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<span[^>]*material-symbols[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;|&raquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function short(text: string, max = 40): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function withText(kind: string, text: string): string {
  return text ? `${kind}: ${short(text)}` : kind;
}

function describeElement(html: string, el: ElementNode): string {
  const source = html.slice(el.start, el.end);
  const openTag = html.slice(el.start, el.openEnd);
  const text = plainText(source);
  const tag = el.tag;
  if (/^h[1-6]$/.test(tag)) return withText('Заголовок', text);
  if (tag === 'p') return withText('Текст', text);
  if (tag === 'ul' || tag === 'ol') return withText('Список', text);
  if (tag === 'table') return 'Таблица';
  if (tag === 'script' || tag === 'style') return 'Служебный код';
  if (tag === 'video' || /<video\b/i.test(source)) return 'Видео';
  if (tag === 'a' || tag === 'button') return text ? withText('Кнопка', text) : /<img\b/i.test(source) ? 'Фото' : 'Кнопка';
  if (tag === 'span' && /material-symbols/.test(openTag)) {
    const icon = plainText(source.replace(/<span[^>]*>/i, '').replace(/<\/span>$/i, ''));
    return withText('Иконка', icon);
  }
  if (tag === 'img' || tag === 'picture' || tag === 'figure' || (!text && /<img\b|url\(/i.test(source))) return 'Фото';
  if (!text) return /<svg\b|material-symbols/i.test(source) ? 'Иконка' : 'Декор (фон)';
  if (/<(a|button)\b/i.test(source) && text.length < 60) return withText('Кнопка', text);
  if (/rounded-full/.test(openTag) && text.length < 40) return withText('Плашка', text);
  return withText('Элемент', text);
}

function describeBox(html: string, el: ElementNode): string {
  const openTag = html.slice(el.start, el.openEnd);
  const cls = /\bclass=(["'])(.*?)\1/i.exec(openTag)?.[2] ?? '';
  const heading = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i.exec(html.slice(el.openEnd, el.closeStart));
  let kind = 'Контейнер';
  if (/(^|\s)(md:|lg:|sm:)?grid(\s|$)|grid-cols/.test(cls)) kind = 'Сетка';
  else if (el.tag === 'article' || /card|glass/.test(cls)) kind = 'Карточка';
  else if (el.tag === 'section') kind = 'Секция';
  else if (/flex-col|space-y-/.test(cls)) kind = 'Колонка';
  else if (/(^|\s)flex(\s|$)/.test(cls)) kind = 'Ряд';
  return withText(kind, heading ? plainText(heading[2]) : '');
}

type BoxBlock = Extract<ContentBlock, { type: 'box' }>;

function buildBox(html: string, el: ElementNode, id: string, depth: number, budget: { left: number }): BoxBlock {
  const content: ContentBlock[] = [];
  let pending = '';
  let index = 0;
  for (const child of el.children) {
    if (child.kind !== 'element') {
      pending += html.slice(child.start, child.end);
      continue;
    }
    const childId = `${id}-${index++}`;
    budget.left -= 1;
    if (budget.left > 0 && splittable(html, child, depth + 1)) {
      const box = buildBox(html, child, childId, depth + 1, budget);
      if (pending) box.lead = pending;
      content.push(box);
    } else {
      content.push({
        id: childId,
        type: 'html',
        raw: true,
        content: pending + html.slice(child.start, child.end),
        label: describeElement(html, child),
      });
    }
    pending = '';
  }
  const box: BoxBlock = {
    id,
    type: 'box',
    label: describeBox(html, el),
    open: html.slice(el.start, el.openEnd),
    content,
    close: html.slice(el.closeStart, el.end),
  };
  if (pending) box.tail = pending;
  return box;
}

/**
 * Секция сайта (сырой HTML) → контейнер с элементами внутри.
 * null — секцию оставляем цельной (сложная или несбалансированная разметка).
 */
export function decomposeSiteSection(html: string, id: string, label?: string): BoxBlock | null {
  const nodes = parseHtml(html);
  if (!nodes) return null;
  const elements = nodes.filter((n): n is ElementNode => n.kind === 'element');
  if (elements.length !== 1) return null;
  if (nodes.some((n) => n.kind === 'text' && html.slice(n.start, n.end).trim() !== '')) return null;
  const root = elements[0];
  if (!splittable(html, root, 0)) return null;
  const box = buildBox(html, root, id, 0, { left: NODE_BUDGET });
  if (root.start > 0) box.lead = html.slice(0, root.start);
  if (root.end < html.length) box.trail = html.slice(root.end);
  if (label) box.label = label;
  return box;
}
