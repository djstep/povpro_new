'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentBlocksEditor } from '@/components/admin/ContentBlocksEditor';
import type { ContentBlock } from '@/lib/cms/content-blocks';
import { applyTextOverridesLocally, htmlToContentBlocks } from '@/lib/cms/html-to-blocks';

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

function blocksSignature(blocks: ContentBlock[]) {
  return JSON.stringify(blocks);
}

export function PageEditor({ slugPath }: { slugPath: string }) {
  const apiSlug =
    slugPath === '' ? 'home' : slugPath.split('/').map(encodeURIComponent).join('/');
  const [data, setData] = useState<PageData | null>(null);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tab, setTab] = useState<'content' | 'html' | 'settings'>('content');
  const [importedFromFile, setImportedFromFile] = useState(false);
  const [baseline, setBaseline] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => blocksSignature(contentBlocks) !== baseline,
    [contentBlocks, baseline],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pageRes, catRes] = await Promise.all([
        fetch(`/api/admin/pages/${apiSlug}`),
        fetch('/api/admin/categories'),
      ]);
      const json = (await pageRes.json()) as PageData & { error?: string };
      if (!pageRes.ok) throw new Error(json.error);
      const catJson = (await catRes.json()) as { categories?: CategoryOption[] };
      setCategories(catJson.categories ?? []);
      setData(json);
      setHtml(json.html);
      setTitle(json.title);
      setMeta(json.pageMeta);

      const existing = json.contentBlocks ?? [];
      if (existing.length > 0) {
        setContentBlocks(existing);
        setBaseline(blocksSignature(existing));
        setImportedFromFile(false);
      } else {
        const base = json.baseHtml ?? json.html;
        const withText = applyTextOverridesLocally(base, json.textBlocks ?? []);
        const imported = htmlToContentBlocks(withText);
        setContentBlocks(imported);
        // Пока не сохранено в БД — считаем «несохранённым», чтобы можно было зафиксировать
        setBaseline('__unsaved_import__');
        setImportedFromFile(true);
      }
      setTab('content');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [apiSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  // Черновик блоков в localStorage
  useEffect(() => {
    if (!data || loading) return;
    const key = `povpro-admin-blocks-draft:${slugPath || 'home'}`;
    if (!dirty) {
      localStorage.removeItem(key);
      return;
    }
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        key,
        JSON.stringify({ savedAt: Date.now(), blocks: contentBlocks, importedFromFile }),
      );
    }, 700);
    return () => window.clearTimeout(timer);
  }, [contentBlocks, dirty, data, loading, slugPath, importedFromFile]);

  useEffect(() => {
    if (!data || loading) return;
    const key = `povpro-admin-blocks-draft:${slugPath || 'home'}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        blocks?: ContentBlock[];
        importedFromFile?: boolean;
      };
      if (parsed.blocks?.length) {
        setContentBlocks(parsed.blocks);
        if (typeof parsed.importedFromFile === 'boolean') {
          setImportedFromFile(parsed.importedFromFile);
        }
        setMessage('Восстановлен черновик контента');
      }
    } catch {
      /* ignore */
    }
    // только после первой загрузки страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.slug]);

  async function savePage(payload: Record<string, unknown>, successMsg: string) {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/pages/${apiSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ...payload }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Ошибка');
      setMessage(successMsg);
      localStorage.removeItem(`povpro-admin-blocks-draft:${slugPath || 'home'}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  async function saveContentBlocks() {
    const confirmMsg = importedFromFile
      ? 'Страница будет сохранена как набор блоков в базе. Внешний вид сохранится. Продолжить?'
      : null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    await savePage({ contentBlocks }, 'Контент сохранён');
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

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {tab === 'content' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs">
              {dirty ? (
                <span className="text-amber-400">Есть несохранённые правки</span>
              ) : (
                <span className="text-emerald-500">Сохранено</span>
              )}
            </p>
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => void saveContentBlocks()}
              className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
          <ContentBlocksEditor
            blocks={contentBlocks}
            onChange={setContentBlocks}
            importedFromFile={importedFromFile}
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
