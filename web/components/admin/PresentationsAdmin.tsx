'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { readAdminJson, uploadAdminFile } from '@/lib/admin-upload-client';

type DocSlot = {
  src: string;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  pages: string[];
  alt?: string;
  effectiveSrc: string;
  override: { id: string; replacementSrc: string } | null;
};

type LibraryItem = {
  src: string;
  filename: string;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  source: 'upload' | 'site';
  sizeBytes: number | null;
  pages: string[];
  usedAsOverrideFor: string[];
};

function pageLabel(slug: string) {
  if (slug === 'home' || slug === '') return 'Главная';
  return `/${slug}`;
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}

export function PresentationsAdmin() {
  const [slots, setSlots] = useState<DocSlot[]>([]);
  const [docs, setDocs] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/media');
      const data = await readAdminJson<{ items?: DocSlot[]; library?: LibraryItem[]; error?: string }>(res);
      if (!res.ok) throw new Error(data.error);
      setSlots((data.items ?? []).filter((i) => i.kind === 'DOCUMENT' && i.pages.length > 0));
      setDocs((data.library ?? []).filter((i) => i.kind === 'DOCUMENT'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function replace(slot: DocSlot, replacementSrc: string) {
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalSrc: slot.src, replacementSrc, kind: 'DOCUMENT' }),
    });
    const data = await readAdminJson<{ error?: unknown }>(res);
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Ошибка сохранения');
      return;
    }
    setMessage('Файл презентации заменён. На сайте кнопка теперь открывает новый PDF.');
    await load();
  }

  async function uploadAndReplace(slot: DocSlot, file: File) {
    setBusy(slot.src);
    setError('');
    try {
      const result = await uploadAdminFile(file);
      await replace(slot, result.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setBusy(null);
    }
  }

  async function reset(slot: DocSlot) {
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-override', originalSrc: slot.src }),
    });
    if (!res.ok) {
      const data = await readAdminJson<{ error?: string }>(res);
      setError(data.error ?? 'Не удалось сбросить');
      return;
    }
    setMessage('Возвращён исходный файл');
    await load();
  }

  async function uploadToLibrary(file: File) {
    setBusy('library');
    setMessage('');
    setError('');
    try {
      const result = await uploadAdminFile(file);
      setMessage(`PDF загружен: ${result.path}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setBusy(null);
    }
  }

  async function deleteDoc(item: LibraryItem) {
    const used = item.pages.length > 0 || item.usedAsOverrideFor.length > 0;
    if (!window.confirm(used ? 'Файл используется на сайте. Всё равно удалить?' : 'Удалить файл?')) return;
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-file', src: item.src, force: true }),
    });
    const data = await readAdminJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? 'Не удалось удалить');
      return;
    }
    setMessage('Файл удалён');
    await load();
  }

  if (loading) return <p className="text-zinc-500">Загрузка…</p>;

  return (
    <div className="space-y-8">
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Кнопки-презентации на сайте</h2>
        <p className="text-sm text-zinc-500">
          Здесь можно заменить PDF у существующей кнопки (например, «Презентация компании» на главной). Текст и
          оформление кнопки не меняются.
        </p>
        {slots.length === 0 ? (
          <p className="text-sm text-zinc-500">На страницах пока нет ссылок на PDF.</p>
        ) : (
          <ul className="space-y-3">
            {slots.map((slot) => (
              <li key={slot.src} className="rounded-xl border border-zinc-800 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100 font-medium">{slot.alt || 'Ссылка на PDF'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {slot.pages.map(pageLabel).join(', ')}
                    </p>
                  </div>
                  <a
                    href={slot.effectiveSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-zinc-400 hover:text-white shrink-0"
                  >
                    Открыть текущий PDF →
                  </a>
                </div>
                <p className="text-xs font-mono text-zinc-400 break-all">
                  {slot.override ? (
                    <>
                      <span className="text-zinc-600 line-through">{slot.src}</span> → {slot.effectiveSrc}
                    </>
                  ) : (
                    slot.src
                  )}
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-sm font-medium cursor-pointer">
                    {busy === slot.src ? 'Загрузка…' : 'Загрузить новый PDF'}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={busy !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) void uploadAndReplace(slot, f);
                      }}
                    />
                  </label>
                  {docs.some((d) => d.source === 'upload') && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) void replace(slot, e.target.value);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm"
                    >
                      <option value="">…или выбрать из загруженных</option>
                      {docs
                        .filter((d) => d.source === 'upload')
                        .map((d) => (
                          <option key={d.src} value={d.src}>
                            {d.filename}
                          </option>
                        ))}
                    </select>
                  )}
                  {slot.override && (
                    <button
                      type="button"
                      onClick={() => void reset(slot)}
                      className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm"
                    >
                      Вернуть исходный
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Добавить или убрать кнопку</h2>
        <div className="text-sm text-zinc-400 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p>
            Откройте <Link href="/admin/pages" className="text-sky-400 hover:underline">Страницы</Link> → нужная
            страница → вкладка «Контент».
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b className="text-zinc-200">Новая кнопка в любом месте страницы</b> — «+ Кнопка-презентация»,
              затем выберите или загрузите PDF. В одном блоке может быть несколько кнопок.
            </li>
            <li>
              <b className="text-zinc-200">Ещё одна кнопка рядом с существующей</b> (например, на главной рядом с
              «Презентация компании») — откройте секцию с пометкой «PDF» и нажмите «+ Добавить кнопку рядом».
            </li>
            <li>
              <b className="text-zinc-200">Убрать кнопку</b> — «Убрать» у кнопки или «Удалить» у всего блока.
            </li>
          </ul>
          <p>После правок нажмите «Сохранить» вверху редактора.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">PDF-файлы</h2>
          <label className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-sm font-medium cursor-pointer">
            {busy === 'library' ? 'Загрузка…' : 'Загрузить PDF'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void uploadToLibrary(f);
              }}
            />
          </label>
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-zinc-500">PDF-файлов пока нет.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {docs.map((item) => (
              <li key={item.src} className="flex flex-wrap items-center gap-3 justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{item.filename}</p>
                  <p className="text-[11px] text-zinc-500 font-mono truncate">
                    {item.src}
                    {item.sizeBytes !== null ? ` · ${formatBytes(item.sizeBytes)}` : ''}
                    {item.pages.length > 0 ? ` · ${item.pages.map(pageLabel).join(', ')}` : ''}
                    {item.usedAsOverrideFor.length > 0 ? ' · используется как замена' : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={item.src}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    Открыть
                  </a>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(item.src)}
                    className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    Копировать путь
                  </button>
                  {item.source === 'upload' && (
                    <button
                      type="button"
                      onClick={() => void deleteDoc(item)}
                      className="rounded-lg border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
