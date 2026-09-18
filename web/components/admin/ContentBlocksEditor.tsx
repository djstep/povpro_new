'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  blockTypeLabel,
  isEditableContentBlock,
  newBlockId,
  renderContentBlocks,
  type ContentBlock,
} from '@/lib/cms/content-blocks';

type LibraryItem = {
  src: string;
  filename: string;
  kind: 'IMAGE' | 'VIDEO';
};

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  importedFromFile?: boolean;
};

const ADDABLE = [
  { type: 'heading' as const, label: 'Заголовок' },
  { type: 'text' as const, label: 'Текст' },
  { type: 'image' as const, label: 'Изображение' },
  { type: 'video' as const, label: 'Видео' },
  { type: 'hero' as const, label: 'Hero-блок' },
];

function createBlock(type: (typeof ADDABLE)[number]['type']): ContentBlock {
  const id = newBlockId();
  switch (type) {
    case 'hero':
      return { id, type: 'hero', title: 'Заголовок', subtitle: '' };
    case 'heading':
      return { id, type: 'heading', level: 2, text: 'Заголовок' };
    case 'text':
      return { id, type: 'text', content: '<p>Текст</p>' };
    case 'image':
      return { id, type: 'image', src: '/assets/img/placeholder.svg', alt: '' };
    case 'video':
      return { id, type: 'video', src: '' };
  }
}

export function ContentBlocksEditor({ blocks, onChange, importedFromFile }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [pickerFor, setPickerFor] = useState<{ id: string; kind: 'IMAGE' | 'VIDEO' } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);

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

  function insertBlock(type: (typeof ADDABLE)[number]['type'], atIndex: number) {
    const block = createBlock(type);
    const next = [...editable];
    next.splice(atIndex, 0, block);
    replaceBlocks(next);
    setActiveId(block.id);
    setInsertAt(null);
    if (type === 'image' || type === 'video') {
      setPickerFor({ id: block.id, kind: type === 'image' ? 'IMAGE' : 'VIDEO' });
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

  const uploadFor = useCallback(
    async (id: string, file: File) => {
      setUploading(id);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const data = (await res.json()) as { path?: string; error?: string };
        if (data.path) {
          const block = blocks.find((b) => b.id === id);
          if (block?.type === 'image' || block?.type === 'video') {
            updateById(id, { src: data.path });
          } else if (block?.type === 'hero') {
            updateById(id, { image: data.path });
          }
        }
      } finally {
        setUploading(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks],
  );

  const active = blocks.find((b) => b.id === activeId) ?? null;

  return (
    <div className="space-y-4">
      {importedFromFile && (
        <p className="text-sm text-amber-400/90 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2">
          Страница загружена из текущего сайта как набор секций. Внешний вид сохранится. Можно добавлять,
          переставлять и удалять блоки. Нажмите «Сохранить», чтобы зафиксировать в базе.
        </p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-500 mr-1">Добавить:</span>
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
            Превью · клик по блоку слева в списке
          </div>
          <div
            className="cms-blocks-preview flex-1 overflow-auto max-h-[75vh] p-4 bg-[#0c0e12]"
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
                      {blockTypeLabel(block)}
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
                      onPickMedia={() =>
                        setPickerFor({
                          id: block.id,
                          kind: block.type === 'video' ? 'VIDEO' : 'IMAGE',
                        })
                      }
                      onUpload={(file) => void uploadFor(block.id, file)}
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

      {pickerFor && (
        <MediaPickerModal
          kind={pickerFor.kind}
          library={library.filter((l) => l.kind === pickerFor.kind)}
          onClose={() => setPickerFor(null)}
          onSelect={(src) => {
            const block = blocks.find((b) => b.id === pickerFor.id);
            if (block?.type === 'hero') updateById(pickerFor.id, { image: src });
            else updateById(pickerFor.id, { src });
            setPickerFor(null);
          }}
          onUploaded={(item) => {
            setLibrary((prev) => [item, ...prev]);
            const block = blocks.find((b) => b.id === pickerFor.id);
            if (block?.type === 'hero') updateById(pickerFor.id, { image: item.src });
            else updateById(pickerFor.id, { src: item.src });
            setPickerFor(null);
          }}
        />
      )}
    </div>
  );
}

function BlockFields({
  block,
  uploading,
  onChange,
  onPickMedia,
  onUpload,
}: {
  block: ContentBlock;
  uploading: boolean;
  onChange: (patch: Partial<ContentBlock>) => void;
  onPickMedia: () => void;
  onUpload: (file: File) => void;
}) {
  if (block.type === 'shell') return null;

  if (block.type === 'hero') {
    return (
      <div className="space-y-2 pt-1">
        <input
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Заголовок"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <input
          value={block.subtitle ?? ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Подзаголовок"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <input
          value={block.badge ?? ''}
          onChange={(e) => onChange({ badge: e.target.value })}
          placeholder="Плашка (необязательно)"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <MediaField
          src={block.image ?? ''}
          uploading={uploading}
          accept="image/*"
          onSrc={(src) => onChange({ image: src })}
          onPick={onPickMedia}
          onUpload={onUpload}
        />
      </div>
    );
  }

  if (block.type === 'heading') {
    return (
      <div className="space-y-2 pt-1 flex flex-wrap gap-2 items-center">
        <select
          value={block.level}
          onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
        >
          <option value={1}>Крупный</option>
          <option value={2}>Средний</option>
          <option value={3}>Мелкий</option>
        </select>
        <input
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="flex-1 min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <textarea
        value={block.content}
        onChange={(e) => onChange({ content: e.target.value })}
        rows={5}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
      />
    );
  }

  if (block.type === 'html') {
    return (
      <div className="space-y-2 pt-1">
        <input
          value={block.label ?? ''}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Название секции"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
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
          accept="image/*"
          onSrc={(src) => onChange({ src })}
          onPick={onPickMedia}
          onUpload={onUpload}
        />
        <input
          value={block.alt ?? ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Описание для слабовидящих"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <input
          value={block.caption ?? ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Подпись под фото"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
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
          accept="video/*"
          onSrc={(src) => onChange({ src })}
          onPick={onPickMedia}
          onUpload={onUpload}
        />
        <input
          value={block.poster ?? ''}
          onChange={(e) => onChange({ poster: e.target.value })}
          placeholder="Постер (необязательно)"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono"
        />
      </div>
    );
  }

  return null;
}

function MediaField({
  src,
  uploading,
  accept,
  onSrc,
  onPick,
  onUpload,
}: {
  src: string;
  uploading: boolean;
  accept: string;
  onSrc: (src: string) => void;
  onPick: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      {src && accept.startsWith('image') && (
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
            accept={accept}
            className="hidden"
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

function MediaPickerModal({
  kind,
  library,
  onClose,
  onSelect,
  onUploaded,
}: {
  kind: 'IMAGE' | 'VIDEO';
  library: LibraryItem[];
  onClose: () => void;
  onSelect: (src: string) => void;
  onUploaded: (item: LibraryItem) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { path?: string; kind?: string; error?: string };
      if (data.path) {
        onUploaded({
          src: data.path,
          filename: data.path.split('/').pop() ?? data.path,
          kind: (data.kind as 'IMAGE' | 'VIDEO') ?? kind,
        });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 flex flex-col shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-medium">Выбрать {kind === 'IMAGE' ? 'изображение' : 'видео'}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            Закрыть
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 space-y-4">
          <label className="inline-flex rounded-lg bg-white text-zinc-900 px-3 py-2 text-sm font-medium cursor-pointer">
            {uploading ? 'Загрузка…' : 'Загрузить новый файл'}
            <input
              type="file"
              accept={kind === 'IMAGE' ? 'image/*' : 'video/*'}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void upload(f);
              }}
            />
          </label>
          {library.length === 0 ? (
            <p className="text-sm text-zinc-500">В библиотеке пока нет подходящих файлов.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {library.map((item) => (
                <li key={item.src}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.src)}
                    className="w-full border border-zinc-800 rounded-lg overflow-hidden hover:border-sky-500/50 text-left"
                  >
                    <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                      {item.kind === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.src} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-500">Видео</span>
                      )}
                    </div>
                    <p className="px-2 py-1.5 text-[11px] text-zinc-400 truncate">{item.filename}</p>
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
