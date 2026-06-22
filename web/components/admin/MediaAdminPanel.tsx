'use client';

import { useCallback, useEffect, useState } from 'react';

type MediaItem = {
  src: string;
  kind: 'IMAGE' | 'VIDEO';
  pages: string[];
  alt?: string;
  effectiveSrc: string;
  override: {
    id: string;
    replacementSrc: string;
    alt: string | null;
    kind: 'IMAGE' | 'VIDEO';
    updatedAt: string;
  } | null;
};

export function MediaAdminPanel() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = (await res.json()) as { items?: MediaItem[]; error?: string };
      if (!res.ok) throw new Error(data.error);
      setItems(data.items ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveItem(item: MediaItem, replacementSrc: string, alt: string) {
    setMessage('');
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSrc: item.src,
        replacementSrc,
        alt: alt || undefined,
        kind: item.kind,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Ошибка сохранения');
      return;
    }
    setMessage('Сохранено');
    await load();
  }

  async function resetItem(item: MediaItem) {
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalSrc: item.src }),
    });
    if (res.ok) {
      setMessage('Замена сброшена');
      await load();
    }
  }

  async function uploadFile(file: File, item: MediaItem) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { path?: string; error?: string };
    if (!res.ok || !data.path) {
      setMessage(data.error ?? 'Ошибка загрузки');
      return;
    }
    await saveItem(item, data.path, item.alt ?? '');
  }

  const filtered = items.filter(
    (i) =>
      i.src.toLowerCase().includes(filter.toLowerCase()) ||
      i.effectiveSrc.toLowerCase().includes(filter.toLowerCase()) ||
      i.pages.some((p) => p.includes(filter)),
  );

  if (loading) return <p className="text-zinc-500">Загрузка медиа…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Поиск по URL или странице…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm w-full sm:max-w-md"
        />
        <p className="text-sm text-zinc-500">{filtered.length} файлов</p>
      </div>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <ul className="space-y-4">
        {filtered.map((item) => (
          <MediaRow
            key={item.src}
            item={item}
            onSave={saveItem}
            onReset={resetItem}
            onUpload={uploadFile}
          />
        ))}
      </ul>
    </div>
  );
}

function MediaRow({
  item,
  onSave,
  onReset,
  onUpload,
}: {
  item: MediaItem;
  onSave: (item: MediaItem, replacementSrc: string, alt: string) => Promise<void>;
  onReset: (item: MediaItem) => Promise<void>;
  onUpload: (file: File, item: MediaItem) => Promise<void>;
}) {
  const [replacementSrc, setReplacementSrc] = useState(item.override?.replacementSrc ?? item.src);
  const [alt, setAlt] = useState(item.alt ?? item.override?.alt ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReplacementSrc(item.override?.replacementSrc ?? item.src);
    setAlt(item.alt ?? item.override?.alt ?? '');
  }, [item]);

  const previewSrc = item.kind === 'IMAGE' ? item.effectiveSrc : null;
  const isVideo = item.kind === 'VIDEO';

  return (
    <li className="border border-zinc-800 rounded-xl p-4 grid gap-4 lg:grid-cols-[120px_1fr]">
      <div className="flex items-center justify-center bg-zinc-900 rounded-lg min-h-[80px] overflow-hidden">
        {previewSrc && !isVideo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="max-h-24 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-zinc-500 text-center px-2">{isVideo ? 'VIDEO' : '—'}</span>
        )}
      </div>
      <div className="space-y-3 min-w-0">
        <div>
          <p className="text-xs text-zinc-500 break-all">Исходный: {item.src}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Страницы: {item.pages.slice(0, 5).join(', ')}
            {item.pages.length > 5 ? '…' : ''}
          </p>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">Новый URL / путь</span>
          <input
            value={replacementSrc}
            onChange={(e) => setReplacementSrc(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono"
          />
        </label>
        {item.kind === 'IMAGE' && (
          <label className="block text-sm">
            <span className="text-zinc-400">Alt-текст</span>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(item, replacementSrc, alt);
              setSaving(false);
            }}
            className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Сохранить
          </button>
          {item.override && (
            <button
              type="button"
              onClick={() => onReset(item)}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm"
            >
              Сбросить
            </button>
          )}
          <label className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm cursor-pointer">
            Загрузить файл
            <input
              type="file"
              accept={item.kind === 'VIDEO' ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f, item);
              }}
            />
          </label>
        </div>
      </div>
    </li>
  );
}
