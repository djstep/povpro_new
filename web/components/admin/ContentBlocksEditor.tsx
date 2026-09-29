'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  blockTypeLabel,
  isEditableContentBlock,
  newBlockId,
  renderContentBlocks,
  type ButtonItem,
  type ContentBlock,
  type ImageLayout,
} from '@/lib/cms/content-blocks';
import { uploadAdminFile } from '@/lib/admin-upload-client';

type LibKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

type LibraryItem = {
  src: string;
  previewSrc?: string;
  filename: string;
  kind: LibKind;
  source?: 'upload' | 'site';
};

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  importedFromFile?: boolean;
};

/** Куда подставить выбранный в библиотеке файл */
type PickerTarget =
  | { field: 'src' }
  | { field: 'image' }
  | { field: 'button'; index: number }
  | { field: 'sectionLink'; index: number };

type PickerState = { blockId: string; kind: LibKind; target: PickerTarget };

const ACCEPT: Record<LibKind, string> = {
  IMAGE: 'image/jpeg,image/png,image/webp,image/gif',
  VIDEO: 'video/mp4,video/webm,video/ogg',
  DOCUMENT: 'application/pdf,.pdf',
};

const ADDABLE = [
  { type: 'section' as const, label: 'Заголовок раздела' },
  { type: 'subheading' as const, label: 'Подзаголовок' },
  { type: 'text' as const, label: 'Текст' },
  { type: 'image' as const, label: 'Изображение' },
  { type: 'video' as const, label: 'Видео' },
  { type: 'presentation' as const, label: 'Кнопка-презентация' },
  { type: 'hero' as const, label: 'Hero-блок' },
];

type AddableType = (typeof ADDABLE)[number]['type'];

function createBlock(type: AddableType): ContentBlock {
  const id = newBlockId();
  switch (type) {
    case 'hero':
      return { id, type: 'hero', title: 'Заголовок', subtitle: '' };
    case 'section':
      return { id, type: 'heading', level: 2, text: 'Заголовок раздела' };
    case 'subheading':
      return { id, type: 'heading', level: 3, text: 'Подзаголовок' };
    case 'text':
      return { id, type: 'text', content: 'Текст абзаца.' };
    case 'image':
      return { id, type: 'image', src: '', alt: '', layout: 'right' };
    case 'video':
      return { id, type: 'video', src: '' };
    case 'presentation':
      return { id, type: 'buttons', items: [{ label: 'Презентация', href: '' }] };
  }
}

const PDF_HREF_RE = /\.pdf(\?|#|$)/i;

function parseSection(html: string): { doc: Document; links: HTMLAnchorElement[] } {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const links = [...doc.body.querySelectorAll<HTMLAnchorElement>('a[href]')].filter((a) =>
    PDF_HREF_RE.test(a.getAttribute('href') ?? ''),
  );
  return { doc, links };
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

function sectionPdfLinks(html: string): ButtonItem[] {
  if (typeof DOMParser === 'undefined' || !/\.pdf/i.test(html)) return [];
  return parseSection(html).links.map((a) => ({
    label: anchorLabel(a),
    href: a.getAttribute('href') ?? '',
  }));
}

/** Правка PDF-кнопок внутри исходной секции сайта с сохранением её вёрстки */
function editSectionLinks(
  html: string,
  edit: (links: HTMLAnchorElement[], doc: Document) => void,
): string {
  const { doc, links } = parseSection(html);
  edit(links, doc);
  return doc.body.innerHTML;
}

export function ContentBlocksEditor({ blocks, onChange, importedFromFile }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  const editable = useMemo(() => blocks.filter(isEditableContentBlock), [blocks]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/media?view=library');
        const data = (await res.json()) as { library?: LibraryItem[] };
        setLibrary(data.library ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const previewHtml = useMemo(() => renderContentBlocks(blocks), [blocks]);

  function replaceBlocks(nextEditable: ContentBlock[]) {
    const shell = blocks.find((b) => b.type === 'shell');
    onChange(shell ? [shell, ...nextEditable] : nextEditable);
  }

  function updateById(id: string, patch: Partial<ContentBlock>) {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)),
    );
  }

  function removeById(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function insertBlock(type: AddableType, atIndex: number) {
    const block = createBlock(type);
    const next = [...editable];
    next.splice(atIndex, 0, block);
    replaceBlocks(next);
    setActiveId(block.id);
    setInsertAt(null);
    if (block.type === 'image') setPicker({ blockId: block.id, kind: 'IMAGE', target: { field: 'src' } });
    if (block.type === 'video') setPicker({ blockId: block.id, kind: 'VIDEO', target: { field: 'src' } });
    if (block.type === 'buttons') {
      setPicker({ blockId: block.id, kind: 'DOCUMENT', target: { field: 'button', index: 0 } });
    }
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropIndex(index);
  }

  function onDrop(targetIndex: number) {
    if (!dragId) return;
    const from = editable.findIndex((b) => b.id === dragId);
    if (from < 0) return;
    let to = targetIndex;
    if (from < to) to -= 1;
    if (from === to) {
      setDragId(null);
      setDropIndex(null);
      return;
    }
    const next = [...editable];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    replaceBlocks(next);
    setDragId(null);
    setDropIndex(null);
  }

  function applyPicked(state: PickerState, src: string, label?: string) {
    const block = blocks.find((b) => b.id === state.blockId);
    if (!block) return;
    const { target } = state;

    if (target.field === 'image' && block.type === 'hero') {
      updateById(block.id, { image: src });
    } else if (target.field === 'src' && (block.type === 'image' || block.type === 'video')) {
      updateById(block.id, { src });
    } else if (target.field === 'button' && block.type === 'buttons') {
      const items = block.items.map((item, i) =>
        i === target.index
          ? {
              href: src,
              label:
                item.label && item.label !== 'Презентация' ? item.label : label?.trim() || item.label,
            }
          : item,
      );
      updateById(block.id, { items });
    } else if (target.field === 'sectionLink' && block.type === 'html') {
      const content = editSectionLinks(block.content, (links) => {
        links[target.index]?.setAttribute('href', src);
      });
      updateById(block.id, { content });
    }
  }

  async function uploadInto(state: PickerState, file: File) {
    setUploading(state.blockId);
    setError('');
    try {
      const result = await uploadAdminFile(file);
      setLibrary((prev) => [
        { src: result.path, previewSrc: result.path, filename: result.filename, kind: result.kind, source: 'upload' },
        ...prev,
      ]);
      applyPicked(state, result.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(null);
    }
  }

  const active = blocks.find((b) => b.id === activeId) ?? null;

  return (
    <div className="space-y-4">
      {importedFromFile && (
        <p className="text-sm text-amber-400/90 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2">
          Страница загружена из текущего сайта как набор секций. Внешний вид сохранится. Можно добавлять,
          переставлять и удалять блоки. Нажмите «Сохранить», чтобы зафиксировать в базе.
        </p>
      )}

      <p className="text-xs text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 leading-relaxed">
        Новые блоки оформляются автоматически в стиле сайта. Подряд идущие блоки собираются в одну
        карточку на стеклянной подложке. «Заголовок раздела» начинает новую карточку. Фото с
        положением «справа» или «слева» встаёт рядом с текстом.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-500 mr-1">Добавить в конец:</span>
        {ADDABLE.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => insertBlock(t.type, editable.length)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-900"
          >
            + {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[70vh]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500">
            Превью · клик по блоку справа в списке
          </div>
          <div
            className="cms-blocks-preview flex-1 overflow-auto max-h-[75vh] p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        <div className="space-y-3">
          <ul className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {editable.map((block, index) => (
              <li key={block.id}>
                {dropIndex === index && dragId && (
                  <div className="h-1 rounded bg-sky-500/80 mb-1" />
                )}
                <div
                  draggable
                  onDragStart={() => onDragStart(block.id)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropIndex(null);
                  }}
                  className={`rounded-xl border p-3 space-y-2 cursor-grab active:cursor-grabbing ${
                    activeId === block.id
                      ? 'border-sky-500/60 bg-sky-500/5'
                      : 'border-zinc-800 bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-left text-sm text-zinc-200 font-medium truncate flex-1"
                      onClick={() => setActiveId(block.id === activeId ? null : block.id)}
                    >
                      {blockListLabel(block)}
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        title="Вставить ниже"
                        onClick={() => setInsertAt(insertAt === index + 1 ? null : index + 1)}
                        className="px-2 py-1 text-xs border border-zinc-700 rounded hover:bg-zinc-800"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeById(block.id)}
                        className="px-2 py-1 text-xs border border-red-900/60 text-red-300 rounded hover:bg-red-950/40"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {insertAt === index + 1 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ADDABLE.map((t) => (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => insertBlock(t.type, index + 1)}
                          className="rounded border border-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-800"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeId === block.id && (
                    <BlockFields
                      block={block}
                      uploading={uploading === block.id}
                      onChange={(patch) => updateById(block.id, patch)}
                      onPick={(kind, target) => setPicker({ blockId: block.id, kind, target })}
                      onUpload={(kind, target, file) =>
                        void uploadInto({ blockId: block.id, kind, target }, file)
                      }
                    />
                  )}
                </div>
              </li>
            ))}
            {dropIndex === editable.length && dragId && (
              <div className="h-1 rounded bg-sky-500/80" />
            )}
            <li
              onDragOver={(e) => {
                e.preventDefault();
                setDropIndex(editable.length);
              }}
              onDrop={() => onDrop(editable.length)}
              className="h-6"
            />
          </ul>

          {active?.type === 'html' && active.raw && (
            <p className="text-xs text-zinc-500">
              Это исходная секция сайта. Правите HTML ниже или замените секцию новыми блоками.
            </p>
          )}
        </div>
      </div>

      {picker && (
        <MediaPickerModal
          kind={picker.kind}
          library={library.filter((l) => l.kind === picker.kind)}
          onClose={() => setPicker(null)}
          onSelect={(item) => {
            applyPicked(picker, item.src, item.source === 'upload' ? undefined : item.filename);
            setPicker(null);
          }}
          onUploaded={(item) => {
            setLibrary((prev) => [item, ...prev]);
            applyPicked(picker, item.src);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function blockListLabel(block: ContentBlock): string {
  if (block.type === 'heading') {
    const kind = block.level === 1 ? 'Заголовок страницы' : block.level === 2 ? 'Раздел' : 'Подзаголовок';
    return `${kind}: ${block.text}`;
  }
  if (block.type === 'html' && block.raw && sectionPdfLinks(block.content).length > 0) {
    return `${blockTypeLabel(block)} · PDF`;
  }
  return blockTypeLabel(block);
}

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm';

function BlockFields({
  block,
  uploading,
  onChange,
  onPick,
  onUpload,
}: {
  block: ContentBlock;
  uploading: boolean;
  onChange: (patch: Partial<ContentBlock>) => void;
  onPick: (kind: LibKind, target: PickerTarget) => void;
  onUpload: (kind: LibKind, target: PickerTarget, file: File) => void;
}) {
  if (block.type === 'shell') return null;

  if (block.type === 'hero') {
    return (
      <div className="space-y-2 pt-1">
        <input
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Заголовок"
          className={inputCls}
        />
        <input
          value={block.subtitle ?? ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Подзаголовок"
          className={inputCls}
        />
        <input
          value={block.badge ?? ''}
          onChange={(e) => onChange({ badge: e.target.value })}
          placeholder="Плашка (необязательно)"
          className={inputCls}
        />
        <MediaField
          src={block.image ?? ''}
          uploading={uploading}
          kind="IMAGE"
          onSrc={(src) => onChange({ image: src })}
          onPick={() => onPick('IMAGE', { field: 'image' })}
          onUpload={(file) => onUpload('IMAGE', { field: 'image' }, file)}
        />
      </div>
    );
  }

  if (block.type === 'heading') {
    return (
      <div className="space-y-2 pt-1">
        <select
          value={block.level}
          onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
        >
          <option value={1}>Заголовок страницы — крупный, по центру, без подложки</option>
          <option value={2}>Заголовок раздела — начинает новую карточку</option>
          <option value={3}>Подзаголовок — голубой, внутри карточки</option>
        </select>
        <input
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className={inputCls}
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className="space-y-1 pt-1">
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={6}
          className={inputCls}
        />
        <p className="text-[11px] text-zinc-500">
          Пустая строка — новый абзац. Можно использовать HTML: &lt;b&gt;жирный&lt;/b&gt;, списки
          &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt;, ссылки &lt;a href=&quot;…&quot;&gt;.
        </p>
      </div>
    );
  }

  if (block.type === 'html') {
    return (
      <div className="space-y-2 pt-1">
        <input
          value={block.label ?? ''}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Название секции"
          className={inputCls}
        />
        {block.raw && (
          <SectionPdfLinksEditor
            html={block.content}
            uploading={uploading}
            onHtml={(content) => onChange({ content })}
            onPick={(index) => onPick('DOCUMENT', { field: 'sectionLink', index })}
            onUpload={(index, file) => onUpload('DOCUMENT', { field: 'sectionLink', index }, file)}
          />
        )}
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={8}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono"
          spellCheck={false}
        />
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-2 pt-1">
        <MediaField
          src={block.src}
          uploading={uploading}
          kind="IMAGE"
          onSrc={(src) => onChange({ src })}
          onPick={() => onPick('IMAGE', { field: 'src' })}
          onUpload={(file) => onUpload('IMAGE', { field: 'src' }, file)}
        />
        <label className="block text-xs text-zinc-400">
          Положение в карточке
          <select
            value={block.layout ?? 'full'}
            onChange={(e) => onChange({ layout: e.target.value as ImageLayout })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
          >
            <option value="right">Справа от текста</option>
            <option value="left">Слева от текста</option>
            <option value="full">Во всю ширину</option>
          </select>
        </label>
        <input
          value={block.alt ?? ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Описание для слабовидящих"
          className={inputCls}
        />
        <input
          value={block.caption ?? ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Подпись под фото"
          className={inputCls}
        />
      </div>
    );
  }

  if (block.type === 'video') {
    return (
      <div className="space-y-2 pt-1">
        <MediaField
          src={block.src}
          uploading={uploading}
          kind="VIDEO"
          onSrc={(src) => onChange({ src })}
          onPick={() => onPick('VIDEO', { field: 'src' })}
          onUpload={(file) => onUpload('VIDEO', { field: 'src' }, file)}
        />
        <input
          value={block.poster ?? ''}
          onChange={(e) => onChange({ poster: e.target.value })}
          placeholder="Постер (необязательно)"
          className={`${inputCls} font-mono`}
        />
      </div>
    );
  }

  if (block.type === 'buttons') {
    const setItems = (items: ButtonItem[]) => onChange({ items });
    return (
      <div className="space-y-3 pt-1">
        {block.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-zinc-800 p-2 space-y-2">
            <div className="flex gap-2">
              <input
                value={item.label}
                onChange={(e) =>
                  setItems(block.items.map((it, i) => (i === index ? { ...it, label: e.target.value } : it)))
                }
                placeholder="Текст кнопки"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setItems(block.items.filter((_, i) => i !== index))}
                className="shrink-0 px-2 py-1 text-xs border border-red-900/60 text-red-300 rounded hover:bg-red-950/40"
              >
                Убрать
              </button>
            </div>
            <DocumentField
              href={item.href}
              uploading={uploading}
              onHref={(href) =>
                setItems(block.items.map((it, i) => (i === index ? { ...it, href } : it)))
              }
              onPick={() => onPick('DOCUMENT', { field: 'button', index })}
              onUpload={(file) => onUpload('DOCUMENT', { field: 'button', index }, file)}
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setItems([...block.items, { label: 'Презентация', href: '' }])}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs hover:bg-zinc-800"
          >
            + Ещё кнопка
          </button>
          <select
            value={block.align ?? ''}
            onChange={(e) =>
              onChange({ align: (e.target.value || undefined) as 'left' | 'center' | undefined })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          >
            <option value="">Выравнивание: авто</option>
            <option value="center">По центру</option>
            <option value="left">По левому краю</option>
          </select>
        </div>
        <p className="text-[11px] text-zinc-500">
          Можно указать PDF из библиотеки или любую ссылку (например, /zakaz). PDF открывается в новой
          вкладке.
        </p>
      </div>
    );
  }

  return null;
}

function SectionPdfLinksEditor({
  html,
  uploading,
  onHtml,
  onPick,
  onUpload,
}: {
  html: string;
  uploading: boolean;
  onHtml: (html: string) => void;
  onPick: (index: number) => void;
  onUpload: (index: number, file: File) => void;
}) {
  const links = useMemo(() => sectionPdfLinks(html), [html]);
  if (links.length === 0) return null;

  return (
    <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-2 space-y-2">
      <p className="text-xs text-sky-300">Кнопки-презентации в этой секции</p>
      {links.map((link, index) => (
        <div key={index} className="rounded-lg border border-zinc-800 p-2 space-y-2">
          <div className="flex gap-2">
            <input
              value={link.label}
              onChange={(e) =>
                onHtml(
                  editSectionLinks(html, (anchors) => {
                    if (anchors[index]) setAnchorLabel(anchors[index], e.target.value);
                  }),
                )
              }
              placeholder="Текст кнопки"
              className={inputCls}
            />
            {links.length > 1 && (
              <button
                type="button"
                onClick={() => onHtml(editSectionLinks(html, (anchors) => anchors[index]?.remove()))}
                className="shrink-0 px-2 py-1 text-xs border border-red-900/60 text-red-300 rounded hover:bg-red-950/40"
              >
                Убрать
              </button>
            )}
          </div>
          <DocumentField
            href={link.href}
            uploading={uploading}
            onHref={(href) =>
              onHtml(editSectionLinks(html, (anchors) => anchors[index]?.setAttribute('href', href)))
            }
            onPick={() => onPick(index)}
            onUpload={(file) => onUpload(index, file)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onHtml(
            editSectionLinks(html, (anchors) => {
              const last = anchors[anchors.length - 1];
              if (!last) return;
              const copy = last.cloneNode(true) as HTMLAnchorElement;
              setAnchorLabel(copy, 'Новая презентация');
              last.after(copy);
            }),
          );
          onPick(links.length);
        }}
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs hover:bg-zinc-800"
      >
        + Добавить кнопку рядом
      </button>
    </div>
  );
}

function DocumentField({
  href,
  uploading,
  onHref,
  onPick,
  onUpload,
}: {
  href: string;
  uploading: boolean;
  onHref: (href: string) => void;
  onPick: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        value={href}
        onChange={(e) => onHref(e.target.value)}
        placeholder="Файл PDF или ссылка"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPick}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs hover:bg-zinc-800"
        >
          PDF из библиотеки
        </button>
        <label className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-800">
          {uploading ? 'Загрузка…' : 'Загрузить PDF'}
          <input
            type="file"
            accept={ACCEPT.DOCUMENT}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onUpload(f);
            }}
          />
        </label>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Открыть
          </a>
        )}
      </div>
    </div>
  );
}

function MediaField({
  src,
  uploading,
  kind,
  onSrc,
  onPick,
  onUpload,
}: {
  src: string;
  uploading: boolean;
  kind: 'IMAGE' | 'VIDEO';
  onSrc: (src: string) => void;
  onPick: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      {src && kind === 'IMAGE' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="max-h-28 rounded-lg object-contain bg-zinc-950" />
      )}
      <input
        value={src}
        onChange={(e) => onSrc(e.target.value)}
        placeholder="Путь к файлу"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPick}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs hover:bg-zinc-800"
        >
          Из библиотеки
        </button>
        <label className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-800">
          {uploading ? 'Загрузка…' : 'Загрузить'}
          <input
            type="file"
            accept={ACCEPT[kind]}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onUpload(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

const PICKER_TITLE: Record<LibKind, string> = {
  IMAGE: 'изображение',
  VIDEO: 'видео',
  DOCUMENT: 'PDF-файл',
};

function MediaPickerModal({
  kind,
  library,
  onClose,
  onSelect,
  onUploaded,
}: {
  kind: LibKind;
  library: LibraryItem[];
  onClose: () => void;
  onSelect: (item: LibraryItem) => void;
  onUploaded: (item: LibraryItem) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return library;
    return library.filter(
      (i) => i.filename.toLowerCase().includes(q) || i.src.toLowerCase().includes(q),
    );
  }, [library, query]);

  async function upload(file: File) {
    setUploading(true);
    setError('');
    try {
      const result = await uploadAdminFile(file);
      onUploaded({
        src: result.path,
        previewSrc: result.path,
        filename: result.filename,
        kind: result.kind,
        source: 'upload',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 flex flex-col shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-medium">Выбрать {PICKER_TITLE[kind]}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            Закрыть
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="inline-flex rounded-lg bg-white text-zinc-900 px-3 py-2 text-sm font-medium cursor-pointer">
              {uploading ? 'Загрузка…' : 'Загрузить новый файл'}
              <input
                type="file"
                accept={ACCEPT[kind]}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void upload(f);
                }}
              />
            </label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск…"
              className="flex-1 min-w-[10rem] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">В библиотеке пока нет подходящих файлов.</p>
          ) : kind === 'DOCUMENT' ? (
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li key={item.src}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full border border-zinc-800 rounded-lg px-3 py-2 hover:border-sky-500/50 text-left"
                  >
                    <p className="text-sm text-zinc-200 truncate">{item.filename}</p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">{item.src}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((item) => (
                <li key={item.src}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full border border-zinc-800 rounded-lg overflow-hidden hover:border-sky-500/50 text-left"
                  >
                    <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                      {item.kind === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewSrc ?? item.src}
                          alt=""
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-zinc-500">Видео</span>
                      )}
                    </div>
                    <p className="px-2 py-1.5 text-[11px] text-zinc-400 truncate">
                      {item.source === 'site' ? '· ' : ''}
                      {item.filename}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
