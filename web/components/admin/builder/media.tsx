'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { uploadAdminFile } from '@/lib/admin-upload-client';

export type LibKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type LibraryItem = {
  src: string;
  previewSrc?: string;
  filename: string;
  kind: LibKind;
  source?: 'upload' | 'site';
};

export const ACCEPT: Record<LibKind, string> = {
  IMAGE: 'image/jpeg,image/png,image/webp,image/gif',
  VIDEO: 'video/mp4,video/webm,video/ogg',
  DOCUMENT: 'application/pdf,.pdf',
};

type MediaContextValue = {
  /** Открыть библиотеку; null — окно закрыли без выбора */
  pick: (kind: LibKind) => Promise<LibraryItem | null>;
  upload: (file: File) => Promise<LibraryItem>;
  /** URL для показа в админке (webp / CDN для файлов сайта) */
  previewSrc: (src: string) => string;
  /** То же для HTML секции: подменяет пути в src/poster/url() */
  previewHtml: (html: string) => string;
};

const MediaContext = createContext<MediaContextValue | null>(null);

export function useMedia(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia вне MediaLibraryProvider');
  return ctx;
}

type PickRequest = { kind: LibKind; resolve: (item: LibraryItem | null) => void };

export function MediaLibraryProvider({
  assetMap,
  children,
}: {
  assetMap: Record<string, string>;
  children: React.ReactNode;
}) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [request, setRequest] = useState<PickRequest | null>(null);
  const requestRef = useRef<PickRequest | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/media?view=library');
        const data = (await res.json()) as { library?: LibraryItem[] };
        setLibrary(data.library ?? []);
      } catch {
        /* библиотека недоступна — остаётся загрузка файлов */
      }
    })();
  }, []);

  const previewMap = useMemo(() => {
    const map = new Map<string, string>(Object.entries(assetMap));
    for (const item of library) {
      if (item.previewSrc && item.previewSrc !== item.src && !map.has(item.src)) {
        map.set(item.src, item.previewSrc);
      }
    }
    return map;
  }, [assetMap, library]);

  const previewSrc = useCallback((src: string) => previewMap.get(src) ?? src, [previewMap]);

  const previewHtml = useCallback(
    (html: string) => {
      if (previewMap.size === 0 || !html.includes('/assets/img/')) return html;
      return html
        .replace(/((?:src|poster)=["'])(\/assets\/img\/[^"']+)(["'])/g, (_, a: string, p: string, b: string) => `${a}${previewSrc(p)}${b}`)
        .replace(/url\((['"]?)(\/assets\/img\/[^'")]+)\1\)/g, (_, q: string, p: string) => `url(${q}${previewSrc(p)}${q})`);
    },
    [previewMap, previewSrc],
  );

  const pick = useCallback((kind: LibKind) => {
    requestRef.current?.resolve(null);
    return new Promise<LibraryItem | null>((resolve) => {
      const next = { kind, resolve };
      requestRef.current = next;
      setRequest(next);
    });
  }, []);

  const upload = useCallback(async (file: File) => {
    const result = await uploadAdminFile(file);
    const item: LibraryItem = {
      src: result.path,
      previewSrc: result.path,
      filename: result.filename,
      kind: result.kind,
      source: 'upload',
    };
    setLibrary((prev) => [item, ...prev]);
    return item;
  }, []);

  const close = (item: LibraryItem | null) => {
    request?.resolve(item);
    requestRef.current = null;
    setRequest(null);
  };

  const value = useMemo(() => ({ pick, upload, previewSrc, previewHtml }), [pick, upload, previewSrc, previewHtml]);

  return (
    <MediaContext.Provider value={value}>
      {children}
      {request && (
        <MediaPickerModal
          kind={request.kind}
          library={library.filter((l) => l.kind === request.kind)}
          upload={upload}
          onClose={() => close(null)}
          onSelect={(item) => close(item)}
        />
      )}
    </MediaContext.Provider>
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
  upload,
  onClose,
  onSelect,
}: {
  kind: LibKind;
  library: LibraryItem[];
  upload: (file: File) => Promise<LibraryItem>;
  onClose: () => void;
  onSelect: (item: LibraryItem) => void;
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

  async function onFile(file: File) {
    setUploading(true);
    setError('');
    try {
      onSelect(await upload(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 flex flex-col shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-medium">Выбрать {PICKER_TITLE[kind]}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            Закрыть
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="inline-flex rounded-md bg-white text-zinc-900 px-3 py-2 text-sm font-medium cursor-pointer">
              {uploading ? 'Загрузка…' : 'Загрузить с компьютера'}
              <input
                type="file"
                accept={ACCEPT[kind]}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void onFile(f);
                }}
              />
            </label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск…"
              className="flex-1 min-w-[10rem] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          {kind === 'IMAGE' && (
            <p className="text-xs text-zinc-500">Фото автоматически сжимаются в WebP перед загрузкой.</p>
          )}
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
                    className="w-full border border-zinc-800 rounded-md px-3 py-2 hover:border-sky-500/50 text-left"
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
                    className="w-full border border-zinc-800 rounded-md overflow-hidden hover:border-sky-500/50 text-left"
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
