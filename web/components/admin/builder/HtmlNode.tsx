'use client';

import { createElement, useCallback, useMemo, type CSSProperties } from 'react';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const ATTR_TO_PROP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  playsinline: 'playsInline',
  autoplay: 'autoPlay',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  viewbox: 'viewBox',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  referrerpolicy: 'referrerPolicy',
  datetime: 'dateTime',
  fetchpriority: 'fetchPriority',
  novalidate: 'noValidate',
};

const BOOLEAN_ATTRS = new Set([
  'controls', 'muted', 'loop', 'autoplay', 'playsinline', 'disabled', 'checked', 'hidden', 'open',
  'allowfullscreen', 'readonly', 'required', 'selected', 'multiple', 'novalidate', 'reversed',
]);

export function styleToObject(style: string): CSSProperties {
  const out: Record<string, string> = {};
  let depth = 0;
  let quote = '';
  let current = '';
  const decls: string[] = [];
  for (const ch of style) {
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ';' && depth === 0) {
      decls.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  decls.push(current);
  for (const decl of decls) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    const key = prop.startsWith('--')
      ? prop
      : prop.toLowerCase().replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = value;
  }
  return out as CSSProperties;
}

function attributesToProps(el: Element): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) continue;
    if (name === 'style') {
      props.style = styleToObject(attr.value);
      continue;
    }
    if (BOOLEAN_ATTRS.has(name)) {
      props[ATTR_TO_PROP[name] ?? name] = true;
      continue;
    }
    props[ATTR_TO_PROP[name] ?? name] = attr.value;
  }
  return props;
}

type ParsedRoot = { tag: string; props: Record<string, unknown>; inner: string } | { multi: true } | null;

function parseRoot(html: string): ParsedRoot {
  if (!html.trim() || typeof document === 'undefined') return null;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const nodes = Array.from(tpl.content.childNodes).filter(
    (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim()),
  );
  if (nodes.length !== 1 || nodes[0].nodeType !== Node.ELEMENT_NODE) return nodes.length ? { multi: true } : null;
  const el = nodes[0] as Element;
  return { tag: el.tagName.toLowerCase(), props: attributesToProps(el), inner: el.innerHTML };
}

/** Открывающий тег вёрстки → тег, класс и стиль (для зоны вложения, которая и есть этот контейнер) */
export function parseOpenTag(open: string): { tag: string; className?: string; style?: CSSProperties } {
  const tag = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(open)?.[1]?.toLowerCase() ?? 'div';
  if (typeof document === 'undefined') return { tag };
  const tpl = document.createElement('template');
  tpl.innerHTML = `${open}</${tag}>`;
  const el = tpl.content.firstElementChild;
  if (!el) return { tag };
  const style = el.getAttribute('style');
  return {
    tag,
    className: el.getAttribute('class') ?? undefined,
    style: style ? styleToObject(style) : undefined,
  };
}

/**
 * Puck ставит перетаскиваемому элементу position: relative. Абсолютные слои (фон, декор)
 * помечаем заранее — CSS холста вернёт им исходное позиционирование.
 */
export function useCanvasRef(dragRef: ((el: Element | null) => void) | null | undefined) {
  return useCallback(
    (el: Element | null) => {
      if (el instanceof HTMLElement && !el.hasAttribute('data-cms-pos') && !el.classList.contains('cmsx-free')) {
        const position = el.ownerDocument.defaultView?.getComputedStyle(el).position;
        if (position === 'absolute' || position === 'fixed' || position === 'sticky') {
          el.setAttribute('data-cms-pos', position);
        }
      }
      dragRef?.(el);
    },
    [dragRef],
  );
}

/** HTML с одним корневым тегом → этот же тег на холсте, без лишних обёрток (важно для сеток и flex-рядов) */
export function HtmlNode({
  html,
  dragRef,
  emptyLabel,
}: {
  html: string;
  dragRef: ((el: Element | null) => void) | null | undefined;
  emptyLabel: string;
}) {
  const parsed = useMemo(() => parseRoot(html), [html]);
  const ref = useCanvasRef(dragRef);
  if (!parsed) {
    return (
      <div ref={ref} className="cms-builder-empty">
        {emptyLabel}
      </div>
    );
  }
  if ('multi' in parsed) return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
  const props: Record<string, unknown> = { ...parsed.props, ref };
  if (!VOID_TAGS.has(parsed.tag)) props.dangerouslySetInnerHTML = { __html: parsed.inner };
  return createElement(parsed.tag, props);
}
