'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data } from '@puckeditor/core';
import type { ContentBlock } from '@/lib/cms/content-blocks';
import {
  blocksSignature,
  blocksToBuilderData,
  builderDataToBlocks,
  type BuilderData,
} from '@/lib/cms/builder-data';
import { applyTextOverridesLocally, htmlToContentBlocks } from '@/lib/cms/html-to-blocks';

const PageBuilder = dynamic(
  () => import('@/components/admin/builder/PageBuilder').then((m) => m.PageBuilder),
  { ssr: false, loading: () => <p className="text-zinc-500">Загрузка конструктора…</p> },
);

type VisualTextBlock = {
  blockKey: string;
  label: string;
  originalText: string;
  content: string;
  saved: boolean;
};

type PageMeta = {
  published: boolean;
  fromDb: boolean;
  updatedAt?: string;
  navSection: string;
  categoryId: string | null;
  showInNav: boolean;
  sortOrder: number;
  isProtected: boolean;
  metaTitle: string;
  metaDesc: string;
};

type PageData = {
  slug: string;
  title: string;
  html: string;
  baseHtml?: string;
  textBlocks: VisualTextBlock[];
  contentBlocks: ContentBlock[];
  assetMap?: Record<string, string>;
  pageMeta: PageMeta;
};

type CategoryOption = { id: string; title: string; navSection: string };

const NAV_SECTIONS = [
  { value: 'NONE', label: 'Не в меню' },
  { value: 'FRICTION', label: 'Фрикционные накладки' },
  { value: 'MECH', label: 'Мехобработка' },
  { value: 'USLUGI', label: 'Услуги' },
  { value: 'TOP_LINK', label: 'Верхнее меню' },
];

type Draft = {
  blocks: ContentBlock[];
  importedFromFile?: boolean;
  /** Подпись серверной версии, поверх которой сделан черновик */
  baseSignature?: string;
  savedAt?: number;
};

function draftKey(slugPath: string) {
  return `povpro-admin-blocks-draft:${slugPath || 'home'}`;
}

/** Черновик, отложенный из-за того, что страницу изменили на другом устройстве */
function staleDraftKey(slugPath: string) {
  return `${draftKey(slugPath)}:stale`;
}

function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return parsed.blocks?.length ? { ...parsed, blocks: parsed.blocks } : null;
  } catch {
    return null;
  }
}

function formatDateTime(value: number | string | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

class ConflictError extends Error {
  constructor(public updatedAt: string | null) {
    super('Страницу уже изменили на другом устройстве');
  }
}

export function PageEditor({ slugPath }: { slugPath: string }) {
  const apiSlug =
    slugPath === '' ? 'home' : slugPath.split('/').map(encodeURIComponent).join('/');
  const [data, setData] = useState<PageData | null>(null);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [builderData, setBuilderData] = useState<BuilderData | null>(null);
  const [builderKey, setBuilderKey] = useState(0);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tab, setTab] = useState<'content' | 'html' | 'settings'>('content');
  const [importedFromFile, setImportedFromFile] = useState(false);
  const [baseline, setBaseline] = useState('');
  /** Подпись исходного содержимого: черновик пишется, только если его реально меняли */
  const [pristine, setPristine] = useState('');
  const [staleDraft, setStaleDraft] = useState<Draft | null>(null);
  const serverUpdatedAt = useRef<string | null>(null);
  const [message, setMessageText] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const setMessage = useCallback((text: string) => {
    setMessageText(text);
    setMessageIsError(false);
  }, []);
  const setError = useCallback((e: unknown) => {
    setMessageText(e instanceof Error ? e.message : 'Ошибка');
    setMessageIsError(true);
  }, []);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => blocksSignature(contentBlocks) !== baseline,
    [contentBlocks, baseline],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pageRes, catRes] = await Promise.all([
        fetch(`/api/admin/pages/${apiSlug}`, { cache: 'no-store' }),
        fetch('/api/admin/categories', { cache: 'no-store' }),
      ]);
      const json = (await pageRes.json()) as PageData & { error?: string };
      if (!pageRes.ok) throw new Error(json.error);
      const catJson = (await catRes.json()) as { categories?: CategoryOption[] };
      setCategories(catJson.categories ?? []);
      setData(json);
      setHtml(json.html);
      setTitle(json.title);
      setMeta(json.pageMeta);
      serverUpdatedAt.current = json.pageMeta.updatedAt ?? null;

      const existing = json.contentBlocks ?? [];
      const fromFile = existing.length === 0;
      const saved = fromFile
        ? htmlToContentBlocks(applyTextOverridesLocally(json.baseHtml ?? json.html, json.textBlocks ?? []))
        : existing;
      // Старые блоки при загрузке переводятся в формат конструктора — эталон считаем уже после перевода
      const savedBlocks = builderDataToBlocks(blocksToBuilderData(saved));
      const savedSignature = blocksSignature(savedBlocks);

      // Черновик годен, только если сделан поверх той же версии, что сейчас на сервере.
      // Иначе показываем свежую версию, а черновик откладываем — его можно открыть вручную.
      let draft = readDraft(draftKey(slugPath));
      if (draft) {
        const draftBlocks = builderDataToBlocks(blocksToBuilderData(draft.blocks));
        if (blocksSignature(draftBlocks) === savedSignature) {
          draft = null;
        } else if (draft.baseSignature !== savedSignature) {
          localStorage.setItem(staleDraftKey(slugPath), JSON.stringify(draft));
          draft = null;
        } else {
          draft = { ...draft, blocks: draftBlocks };
        }
        if (!draft) localStorage.removeItem(draftKey(slugPath));
      }
      setStaleDraft(readDraft(staleDraftKey(slugPath)));
      const startBlocks = draft ? draft.blocks : savedBlocks;

      setContentBlocks(startBlocks);
      setBuilderData(blocksToBuilderData(startBlocks));
      setBuilderKey((k) => k + 1);
      // Пока страница не сохранена в БД — считаем правки несохранёнными, чтобы её можно было зафиксировать
      setBaseline(fromFile ? '__unsaved_import__' : savedSignature);
      setPristine(savedSignature);
      setImportedFromFile(fromFile);
      if (draft) setMessage('Восстановлен несохранённый черновик');
      setTab('content');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [apiSlug, slugPath, setMessage, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const [remoteChangedAt, setRemoteChangedAt] = useState<string | null>(null);
  useEffect(() => {
    if (loading) return;
    let busy = false;
    async function check() {
      if (document.visibilityState !== 'visible' || busy) return;
      busy = true;
      try {
        const res = await fetch(`/api/admin/pages/${apiSlug}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as PageData;
        const remote = json.pageMeta.updatedAt ?? null;
        setRemoteChangedAt(remote && remote !== serverUpdatedAt.current ? remote : null);
      } catch {
        /* нет сети — проверим в следующий раз */
      } finally {
        busy = false;
      }
    }
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [apiSlug, loading]);

  function reloadFresh() {
    if (blocksSignature(contentBlocks) !== pristine) {
      localStorage.setItem(
        draftKey(slugPath),
        JSON.stringify({
          savedAt: Date.now(),
          blocks: contentBlocks,
          importedFromFile,
          baseSignature: pristine,
        } satisfies Draft),
      );
    }
    setRemoteChangedAt(null);
    void load();
  }

  // Черновик блоков в localStorage
  useEffect(() => {
    if (!data || loading) return;
    const key = draftKey(slugPath);
    if (!dirty || blocksSignature(contentBlocks) === pristine) {
      localStorage.removeItem(key);
      return;
    }
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        key,
        JSON.stringify({
          savedAt: Date.now(),
          blocks: contentBlocks,
          importedFromFile,
          baseSignature: pristine,
        } satisfies Draft),
      );
    }, 700);
    return () => window.clearTimeout(timer);
  }, [contentBlocks, dirty, pristine, data, loading, slugPath, importedFromFile]);

  async function sendPage(payload: Record<string, unknown>, force: boolean) {
    const res = await fetch(`/api/admin/pages/${apiSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...payload, baseUpdatedAt: serverUpdatedAt.current, force }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: unknown;
      conflict?: boolean;
      updatedAt?: string | null;
    };
    if (res.status === 409 && json.conflict) throw new ConflictError(json.updatedAt ?? null);
    if (!res.ok) {
      throw new Error(typeof json.error === 'string' ? json.error : `Ошибка сохранения (${res.status})`);
    }
    serverUpdatedAt.current = json.updatedAt ?? null;
  }

  async function putPage(payload: Record<string, unknown>) {
    try {
      await sendPage(payload, false);
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
      const when = e.updatedAt ? ` (${formatDateTime(e.updatedAt)})` : '';
      const overwrite = window.confirm(
        `Эту страницу уже сохранили с другого устройства${when}, пока вы её редактировали.\n\n` +
          'ОК — сохранить вашу версию поверх (правки с другого устройства пропадут).\n' +
          'Отмена — ничего не сохранять. Ваши правки останутся черновиком.',
      );
      if (!overwrite) {
        throw new Error(
          'Не сохранено: страницу изменили на другом устройстве. Обновите страницу, чтобы увидеть свежую версию — ваш черновик можно будет открыть снова.',
        );
      }
      await sendPage(payload, true);
    }
  }

  async function savePage(payload: Record<string, unknown>, successMsg: string) {
    setSaving(true);
    setMessage('');
    try {
      await putPage(payload);
      await load();
      setMessage(successMsg);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  const onBuilderChange = useCallback((next: Data) => {
    setContentBlocks(builderDataToBlocks(next));
  }, []);

  const saveContentBlocks = useCallback(
    async (next: Data) => {
      const blocks = builderDataToBlocks(next);
      if (
        importedFromFile &&
        !window.confirm('Страница будет сохранена в базе как набор блоков. Внешний вид сохранится. Продолжить?')
      ) {
        return;
      }
      setSaving(true);
      setMessage('');
      try {
        await putPage({ contentBlocks: blocks });
        setContentBlocks(blocks);
        setBaseline(blocksSignature(blocks));
        setPristine(blocksSignature(blocks));
        setImportedFromFile(false);
        localStorage.removeItem(draftKey(slugPath));
        setMessage('Страница сохранена');
      } catch (e) {
        setError(e);
      } finally {
        setSaving(false);
      }
    },
    // putPage зависит только от apiSlug и title
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importedFromFile, slugPath, apiSlug, title, setMessage, setError],
  );

  function discardDraft() {
    if (!window.confirm('Отменить все несохранённые правки и вернуть сохранённую версию?')) return;
    localStorage.removeItem(draftKey(slugPath));
    void load();
  }

  function openStaleDraft() {
    if (!staleDraft) return;
    if (
      blocksSignature(contentBlocks) !== pristine &&
      !window.confirm('Текущие несохранённые правки заменятся старым черновиком. Продолжить?')
    ) {
      return;
    }
    const blocks = builderDataToBlocks(blocksToBuilderData(staleDraft.blocks));
    setContentBlocks(blocks);
    setBuilderData(blocksToBuilderData(blocks));
    setBuilderKey((k) => k + 1);
    localStorage.removeItem(staleDraftKey(slugPath));
    setStaleDraft(null);
    setMessage('Открыт ваш старый черновик. Проверьте его перед сохранением — он сделан до чужих правок.');
  }

  function dropStaleDraft() {
    if (!window.confirm('Удалить старый черновик с этого устройства?')) return;
    localStorage.removeItem(staleDraftKey(slugPath));
    setStaleDraft(null);
  }

  async function saveHtml() {
    await savePage({ html }, 'HTML сохранён');
  }

  async function saveSettings() {
    if (!meta) return;
    await savePage(
      {
        published: meta.published,
        navSection: meta.navSection,
        categoryId: meta.categoryId,
        showInNav: meta.showInNav,
        sortOrder: meta.sortOrder,
        metaTitle: meta.metaTitle,
        metaDesc: meta.metaDesc,
      },
      'Настройки сохранены',
    );
  }

  if (loading) return <p className="text-zinc-500">Загрузка…</p>;
  if (!data || !meta) return <p className="text-red-400">{message || 'Страница не найдена'}</p>;

  const publicUrl = slugPath ? `/${slugPath}` : '/';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 outline-none w-full max-w-xl"
          />
          <p className="text-sm text-zinc-500 font-mono">{publicUrl}</p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-zinc-400 hover:text-white shrink-0"
        >
          Открыть на сайте →
        </a>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        {(['content', 'html', 'settings'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${tab === t ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            {t === 'content' && 'Контент'}
            {t === 'html' && 'HTML (дополнительно)'}
            {t === 'settings' && 'Меню и SEO'}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm ${messageIsError ? 'text-red-400' : 'text-emerald-400'}`}>{message}</p>
      )}

      {remoteChangedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sky-700/60 bg-sky-950/40 px-4 py-3 text-sm text-sky-200">
          <p className="max-w-3xl">
            Эту страницу сохранили с другого устройства ({formatDateTime(remoteChangedAt)}). Загрузите свежую
            версию, чтобы не затереть чужие правки. Ваши несохранённые изменения останутся черновиком.
          </p>
          <button
            type="button"
            onClick={reloadFresh}
            className="shrink-0 rounded-md border border-sky-600 px-3 py-1.5 text-xs hover:bg-sky-900/50"
          >
            Загрузить свежую версию
          </button>
        </div>
      )}

      {staleDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          <p className="max-w-3xl">
            На этом устройстве остался несохранённый черновик
            {staleDraft.savedAt ? ` от ${formatDateTime(staleDraft.savedAt)}` : ''}, но страницу с тех пор
            изменили и сохранили. Сейчас показана актуальная версия с сайта.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={openStaleDraft}
              className="rounded-md border border-amber-600 px-3 py-1.5 text-xs hover:bg-amber-900/50"
            >
              Открыть мой черновик
            </button>
            <button
              type="button"
              onClick={dropStaleDraft}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              Удалить черновик
            </button>
          </div>
        </div>
      )}

      {tab === 'content' && builderData && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-zinc-500">
            <p className="max-w-4xl leading-relaxed">
              Перетащите блок из списка слева на страницу. Кликните по блоку, чтобы изменить его справа:
              тексты, фото, расположение, подложку и отступы. Блоки можно перетаскивать мышью, копировать и
              удалять. Переключатель размера экрана над страницей показывает вид на телефоне.
              {importedFromFile && ' Страница пока не сохранена в базе — нажмите «Сохранить», чтобы зафиксировать.'}
            </p>
            {pristine && blocksSignature(contentBlocks) !== pristine && (
              <button
                type="button"
                onClick={discardDraft}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Отменить правки
              </button>
            )}
          </div>
          <PageBuilder
            key={builderKey}
            initialData={builderData}
            assetMap={data.assetMap ?? {}}
            headerTitle={title}
            headerPath={publicUrl}
            publicUrl={publicUrl}
            dirty={dirty}
            saving={saving}
            onChange={onBuilderChange}
            onSave={(next) => void saveContentBlocks(next)}
          />
        </div>
      )}

      {tab === 'html' && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            Полный HTML страницы — для редких правок. Обычное редактирование — во вкладке «Контент».
            Сохранение HTML перезапишет body в базе; если уже есть блоки контента, на сайте приоритет у
            блоков.
          </p>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={24}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono"
            spellCheck={false}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveHtml()}
            className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Сохранить HTML
          </button>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-lg">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.published}
              onChange={(e) => setMeta({ ...meta, published: e.target.checked })}
            />
            Опубликована
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.showInNav}
              onChange={(e) => setMeta({ ...meta, showInNav: e.target.checked })}
            />
            Показывать в меню
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Раздел меню</span>
            <select
              value={meta.navSection}
              onChange={(e) => setMeta({ ...meta, navSection: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            >
              {NAV_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Категория</span>
            <select
              value={meta.categoryId ?? ''}
              onChange={(e) => setMeta({ ...meta, categoryId: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Порядок в меню</span>
            <input
              type="number"
              value={meta.sortOrder}
              onChange={(e) => setMeta({ ...meta, sortOrder: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Meta title</span>
            <input
              value={meta.metaTitle}
              onChange={(e) => setMeta({ ...meta, metaTitle: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Meta description</span>
            <textarea
              value={meta.metaDesc}
              onChange={(e) => setMeta({ ...meta, metaDesc: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSettings()}
            className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Сохранить настройки
          </button>
        </div>
      )}
    </div>
  );
}
