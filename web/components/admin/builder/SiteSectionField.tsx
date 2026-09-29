'use client';

import { useRef, useState } from 'react';
import { FieldLabel, type CustomField } from '@puckeditor/core';
import { LinkInput, inputCls, smallBtnCls } from '@/components/admin/builder/fields';
import { useMedia } from '@/components/admin/builder/media';

type ImageSlot =
  | { kind: 'img'; el: HTMLImageElement }
  | { kind: 'bg'; el: HTMLElement; url: string }
  | { kind: 'video'; el: HTMLVideoElement | HTMLSourceElement };

type Parsed = {
  html: string;
  doc: Document;
  texts: Text[];
  /** Пробелы по краям исходного текста: сохраняются, чтобы слова не «слипались» с соседними тегами */
  edges: Map<Text, { lead: string; trail: string }>;
  images: ImageSlot[];
  links: HTMLAnchorElement[];
};

const SKIP_TEXT_PARENTS = 'script, style, noscript, .material-symbols-outlined, svg';
const BG_URL_RE = /url\((['"]?)([^'")]+)\1\)/i;
const PDF_RE = /\.pdf(\?|#|$)/i;
const MAX_TEXTS = 150;

function parse(html: string): Parsed {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const texts: Text[] = [];
  const edges = new Map<Text, { lead: string; trail: string }>();
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (!text.data.trim()) continue;
    if (text.parentElement?.closest(SKIP_TEXT_PARENTS)) continue;
    texts.push(text);
    edges.set(text, {
      lead: text.data.match(/^\s*/)?.[0] ?? '',
      trail: text.data.match(/\s*$/)?.[0] ?? '',
    });
  }

  const images: ImageSlot[] = [];
  doc.body.querySelectorAll<HTMLElement>('img, video[src], video source[src], [style*="url("]').forEach((el) => {
    if (el instanceof HTMLImageElement) images.push({ kind: 'img', el });
    else if (el instanceof HTMLVideoElement || el instanceof HTMLSourceElement) images.push({ kind: 'video', el });
    else {
      const m = (el.getAttribute('style') ?? '').match(BG_URL_RE);
      if (m) images.push({ kind: 'bg', el, url: m[2] });
    }
  });

  const links = [...doc.body.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
    (a) => (a.getAttribute('href') ?? '#') !== '#',
  );

  return { html, doc, texts, edges, images, links };
}

function textKind(node: Text): string {
  const el = node.parentElement?.closest('h1, h2, h3, h4, h5, h6, a, button, li, td, th, label, figcaption');
  if (!el) return 'Текст';
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return 'Заголовок';
  if (tag === 'a' || tag === 'button') return 'Кнопка / ссылка';
  if (tag === 'li') return 'Пункт списка';
  if (tag === 'td' || tag === 'th') return 'Ячейка таблицы';
  if (tag === 'figcaption') return 'Подпись';
  return 'Текст';
}

function anchorLabel(a: HTMLAnchorElement): string {
  const clone = a.cloneNode(true) as HTMLAnchorElement;
  clone.querySelectorAll('.material-symbols-outlined, img, svg').forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function setAnchorLabel(a: HTMLAnchorElement, label: string) {
  const textNodes = [...a.childNodes].filter(
    (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim(),
  );
  if (textNodes.length > 0) {
    textNodes[0].textContent = ` ${label} `;
    textNodes.slice(1).forEach((n) => n.remove());
  } else {
    a.appendChild(a.ownerDocument.createTextNode(` ${label} `));
  }
}

function slotSrc(slot: ImageSlot): string {
  if (slot.kind === 'bg') return slot.url;
  return slot.el.getAttribute('src') ?? '';
}

function setSlotSrc(slot: ImageSlot, src: string) {
  if (slot.kind === 'bg') {
    const style = slot.el.getAttribute('style') ?? '';
    slot.el.setAttribute('style', style.replace(BG_URL_RE, `url('${src}')`));
    slot.url = src;
    return;
  }
  slot.el.setAttribute('src', src);
  if (slot.kind === 'img') slot.el.removeAttribute('srcset');
}

function textValue(state: Parsed, node: Text): string {
  const { lead, trail } = state.edges.get(node) ?? { lead: '', trail: '' };
  return node.data.slice(lead.length, node.data.length - trail.length);
}

function setTextValue(state: Parsed, node: Text, value: string) {
  const { lead, trail } = state.edges.get(node) ?? { lead: '', trail: '' };
  node.data = `${lead}${value}${trail}`;
}

export function SiteSectionEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const media = useMedia();
  const ref = useRef<Parsed | null>(null);
  const [query, setQuery] = useState('');
  const [showAllTexts, setShowAllTexts] = useState(false);
  const [, force] = useState(0);

  if (typeof DOMParser === 'undefined') return null;
  if (!ref.current || ref.current.html !== value) ref.current = parse(value);
  const state = ref.current;

  const commit = () => {
    const html = state.doc.body.innerHTML;
    state.html = html;
    onChange(html);
    force((n) => n + 1);
  };

  const reparseAndCommit = () => {
    const html = state.doc.body.innerHTML;
    ref.current = parse(html);
    onChange(html);
  };

  const q = query.trim().toLowerCase();
  const textEntries = state.texts
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => !q || node.data.toLowerCase().includes(q));
  const visibleTexts = showAllTexts ? textEntries : textEntries.slice(0, MAX_TEXTS);

  return (
    <div className="space-y-5 text-zinc-900">
      <p className="text-xs text-zinc-500 leading-relaxed">
        Это исходная секция сайта: её вёрстка сохраняется. Здесь можно поменять тексты, фото и ссылки.
        Перемещать и удалять секцию — на холсте или в «Структуре».
      </p>

      {state.images.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Фото и видео ({state.images.length})
          </h4>
          <ul className="grid grid-cols-2 gap-2">
            {state.images.map((slot, index) => {
              const src = slotSrc(slot);
              return (
                <li key={index} className="rounded-md border border-zinc-200 p-1.5 space-y-1.5">
                  {slot.kind === 'video' ? (
                    <div className="aspect-video rounded bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center">
                      Видео
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.previewSrc(src)} alt="" className="aspect-video w-full rounded object-cover bg-zinc-100" />
                  )}
                  <button
                    type="button"
                    className={`${smallBtnCls} w-full`}
                    onClick={async () => {
                      const item = await media.pick(slot.kind === 'video' ? 'VIDEO' : 'IMAGE');
                      if (!item) return;
                      setSlotSrc(slot, item.src);
                      commit();
                    }}
                  >
                    Заменить
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {state.texts.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Тексты ({state.texts.length})
          </h4>
          {state.texts.length > 20 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти текст…"
              className={inputCls}
            />
          )}
          <ul className="space-y-2">
            {visibleTexts.map(({ node, index }) => {
              const text = textValue(state, node);
              const long = text.length > 70;
              const onText = (next: string) => {
                setTextValue(state, node, next);
                commit();
              };
              return (
                <li key={index}>
                  <span className="block text-[11px] text-zinc-500 mb-0.5">{textKind(node)}</span>
                  {long ? (
                    <textarea
                      value={text}
                      rows={Math.min(8, Math.ceil(text.length / 45))}
                      onChange={(e) => onText(e.target.value)}
                      className={inputCls}
                    />
                  ) : (
                    <input value={text} onChange={(e) => onText(e.target.value)} className={inputCls} />
                  )}
                </li>
              );
            })}
          </ul>
          {!showAllTexts && textEntries.length > MAX_TEXTS && (
            <button type="button" className={smallBtnCls} onClick={() => setShowAllTexts(true)}>
              Показать все ({textEntries.length})
            </button>
          )}
        </section>
      )}

      {state.links.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Ссылки и кнопки ({state.links.length})
          </h4>
          <ul className="space-y-3">
            {state.links.map((a, index) => {
              const href = a.getAttribute('href') ?? '';
              const isPdf = PDF_RE.test(href);
              return (
                <li key={index} className="rounded-md border border-zinc-200 p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">
                      {isPdf ? 'PDF · ' : ''}
                      {anchorLabel(a) || 'Без текста'}
                    </span>
                    {isPdf && (
                      <button
                        type="button"
                        className={`${smallBtnCls} text-red-700`}
                        onClick={() => {
                          a.remove();
                          reparseAndCommit();
                        }}
                      >
                        Убрать
                      </button>
                    )}
                  </div>
                  <LinkInput
                    value={href}
                    onChange={(next) => {
                      a.setAttribute('href', next);
                      commit();
                    }}
                  />
                  {isPdf && (
                    <button
                      type="button"
                      className={smallBtnCls}
                      onClick={async () => {
                        const item = await media.pick('DOCUMENT');
                        if (!item) return;
                        const copy = a.cloneNode(true) as HTMLAnchorElement;
                        copy.setAttribute('href', item.src);
                        setAnchorLabel(copy, item.source === 'site' ? item.filename : 'Презентация');
                        a.after(copy);
                        reparseAndCommit();
                      }}
                    >
                      + Такая же кнопка с другим PDF
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <details className="rounded-md border border-zinc-200">
        <summary className="cursor-pointer px-2 py-1.5 text-xs text-zinc-600">HTML-код секции (для опытных)</summary>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full border-t border-zinc-200 px-2 py-1.5 font-mono text-[11px] text-zinc-900 outline-none"
        />
      </details>
    </div>
  );
}

export const siteSectionField: CustomField<string> = {
  type: 'custom',
  label: 'Содержимое секции',
  render: ({ value, onChange }) => (
    <FieldLabel label="Содержимое секции" el="div">
      <SiteSectionEditor value={value ?? ''} onChange={onChange} />
    </FieldLabel>
  ),
};
