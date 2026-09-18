'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type MediaSlot = {
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

type LibraryItem = {
  src: string;
  filename: string;
  kind: 'IMAGE' | 'VIDEO';
  sizeBytes: number;
  mtimeMs: number;
  pages: string[];
  usedAsOverrideFor: string[];
};

type Tab = 'library' | 'slots';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}

function pageLabel(slug: string) {
  if (slug === 'home' || slug === '') return 'Главная';
  return `/${slug}`;
}

export function MediaAdminPanel() {
  const [tab, setTab] = useState<Tab>('library');
  const [slots, setSlots] = useState<MediaSlot[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    item: LibraryItem;
    pages: string[];
    usedAsOverrideFor: string[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/media');
      const data = (await res.json()) as {
        items?: MediaSlot[];
        library?: LibraryItem[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error);
      setSlots(data.items ?? []);
      setLibrary(data.library ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadToLibrary(file: File) {
    setUploading(true);
    setMessage('');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) throw new Error(data.error ?? 'Ошибка загрузки');
      setMessage(`Файл загружен: ${data.path}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  async function requestDelete(item: LibraryItem, force = false) {
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-file', src: item.src, force }),
    });
    const data = (await res.json()) as {
      error?: string;
      requiresForce?: boolean;
      usage?: { pages: string[]; usedAsOverrideFor: string[] };
    };

    if (res.status === 409 && data.requiresForce && data.usage) {
      setPendingDelete({
        item,
        pages: data.usage.pages,
        usedAsOverrideFor: data.usage.usedAsOverrideFor,
      });
      return;
    }

    if (!res.ok) {
      setError(data.error ?? 'Не удалось удалить');
      return;
    }

    setPendingDelete(null);
    setMessage('Файл удалён из библиотеки');
    await load();
  }

  async function saveSlot(item: MediaSlot, replacementSrc: string, alt: string) {
    setMessage('');
    setError('');
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
      setError(data.error ?? 'Ошибка сохранения');
      return;
    }
    setMessage('Замена сохранена');
    await load();
  }

  async function resetSlot(item: MediaSlot) {
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-override', originalSrc: item.src }),
    });
    if (res.ok) {
      setMessage('Замена сброшена');
      await load();
    }
  }

  async function uploadForSlot(file: File, item: MediaSlot) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { path?: string; error?: string };
    if (!res.ok || !data.path) {
      setError(data.error ?? 'Ошибка загрузки');
      return;
    }
    await saveSlot(item, data.path, item.alt ?? '');
  }

  const filteredLibrary = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return library;
    return library.filter(
      (i) =>
        i.filename.toLowerCase().includes(q) ||
        i.src.toLowerCase().includes(q) ||
        i.pages.some((p) => pageLabel(p).toLowerCase().includes(q)),
    );
  }, [library, filter]);

  const filteredSlots = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return slots;
    return slots.filter(
      (i) =>
        i.src.toLowerCase().includes(q) ||
        i.effectiveSrc.toLowerCase().includes(q) ||
        i.pages.some((p) => pageLabel(p).toLowerCase().includes(q)),
    );
  }, [slots, filter]);

  if (loading) return <p className="text-zinc-500">Загрузка медиа…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTab('library')}
          className={`px-3 py-1.5 text-sm rounded-lg ${tab === 'library' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Библиотека
        </button>
        <button
          type="button"
          onClick={() => setTab('slots')}
          className={`px-3 py-1.5 text-sm rounded-lg ${tab === 'slots' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          На страницах
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder={tab === 'library' ? 'Поиск по имени файла…' : 'Поиск по странице или пути…'}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm w-full sm:max-w-md"
        />
        <p className="text-sm text-zinc-500">
          {tab === 'library' ? `${filteredLibrary.length} файлов` : `${filteredSlots.length} мест на сайте`}
        </p>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50">
              {uploading ? 'Загрузка…' : 'Загрузить файл'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void uploadToLibrary(f);
                }}
              />
            </label>
            <p className="text-xs text-zinc-500">
              Файлы хранятся отдельно от страниц. Вставить на страницу: редактор «Контент» → добавить
              изображение/видео → «Из библиотеки», либо вкладка «На страницах» для замены в существующем месте.
            </p>
          </div>

          {filteredLibrary.length === 0 ? (
            <p className="text-sm text-zinc-500">Библиотека пуста. Загрузите первое изображение или видео.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLibrary.map((item) => (
                <li key={item.src} className="border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {item.kind === 'IMAGE' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.src} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-zinc-500">Видео</span>
                    )}
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col">
                    <p className="text-sm text-zinc-200 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatBytes(item.sizeBytes)} ·{' '}
                      {item.pages.length > 0
                        ? `на ${item.pages.length} стр.`
                        : item.usedAsOverrideFor.length > 0
                          ? 'как замена'
                          : 'не используется'}
                    </p>
                    {(item.pages.length > 0 || item.usedAsOverrideFor.length > 0) && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {[...item.pages.map(pageLabel), ...item.usedAsOverrideFor.map((s) => `замена: ${s}`)]
                          .slice(0, 4)
                          .join(', ')}
                      </p>
                    )}
                    <div className="pt-1 mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(item.src)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                      >
                        Копировать путь
                      </button>
                      <button
                        type="button"
                        onClick={() => void requestDelete(item)}
                        className="rounded-lg border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'slots' && (
        <ul className="space-y-4">
          {filteredSlots.map((item) => (
            <MediaSlotRow
              key={item.src}
              item={item}
              library={library}
              onSave={saveSlot}
              onReset={resetSlot}
              onUpload={uploadForSlot}
            />
          ))}
        </ul>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-5 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Файл используется</h2>
            <p className="text-sm text-zinc-400">
              «{pendingDelete.item.filename}» встречается на сайте. Удаление уберёт файл и связанные замены.
            </p>
            {pendingDelete.pages.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Страницы:</p>
                <ul className="text-sm text-zinc-200 list-disc pl-5 space-y-0.5 max-h-40 overflow-auto">
                  {pendingDelete.pages.map((p) => (
                    <li key={p}>{pageLabel(p)}</li>
                  ))}
                </ul>
              </div>
            )}
            {pendingDelete.usedAsOverrideFor.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Используется как замена для:</p>
                <ul className="text-xs text-zinc-400 font-mono list-disc pl-5 space-y-0.5 max-h-28 overflow-auto">
                  {pendingDelete.usedAsOverrideFor.map((s) => (
                    <li key={s} className="break-all">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void requestDelete(pendingDelete.item, true)}
                className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium"
              >
                Всё равно удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaSlotRow({
  item,
  library,
  onSave,
  onReset,
  onUpload,
}: {
  item: MediaSlot;
  library: LibraryItem[];
  onSave: (item: MediaSlot, replacementSrc: string, alt: string) => Promise<void>;
  onReset: (item: MediaSlot) => Promise<void>;
  onUpload: (file: File, item: MediaSlot) => Promise<void>;
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
          <span className="text-xs text-zinc-500 text-center px-2">{isVideo ? 'Видео' : '—'}</span>
        )}
      </div>
      <div className="space-y-3 min-w-0">
        <div>
          <p className="text-sm text-zinc-200">
            {item.pages.length > 0
              ? item.pages.map(pageLabel).slice(0, 6).join(', ')
              : 'Место на сайте'}
            {item.pages.length > 6 ? '…' : ''}
          </p>
          <p className="text-xs text-zinc-500 mt-1 break-all">{item.src}</p>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">Файл на этом месте</span>
          <select
            value={library.some((l) => l.src === replacementSrc) ? replacementSrc : ''}
            onChange={(e) => {
              if (e.target.value) setReplacementSrc(e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="">— выбрать из библиотеки —</option>
            {library
              .filter((l) => l.kind === item.kind)
              .map((l) => (
                <option key={l.src} value={l.src}>
                  {l.filename}
                </option>
              ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Или путь / URL</span>
          <input
            value={replacementSrc}
            onChange={(e) => setReplacementSrc(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono"
          />
        </label>
        {item.kind === 'IMAGE' && (
          <label className="block text-sm">
            <span className="text-zinc-400">Подпись (alt)</span>
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
              Вернуть исходное
            </button>
          )}
          <label className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm cursor-pointer">
            Загрузить новый
            <input
              type="file"
              accept={item.kind === 'VIDEO' ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void onUpload(f, item);
              }}
            />
          </label>
        </div>
      </div>
    </li>
  );
}
