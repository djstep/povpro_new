'use client';

import { useCallback, useEffect, useState } from 'react';
import { ContentBlocksEditor } from '@/components/admin/ContentBlocksEditor';
import type { ContentBlock } from '@/lib/cms/content-blocks';

type TextBlock = {
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
  textBlocks: TextBlock[];
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

export function PageEditor({ slugPath }: { slugPath: string }) {
  const apiSlug =
    slugPath === '' ? 'home' : slugPath.split('/').map(encodeURIComponent).join('/');
  const [data, setData] = useState<PageData | null>(null);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tab, setTab] = useState<'content' | 'text' | 'html' | 'settings'>('content');
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setTextBlocks(json.textBlocks);
      setContentBlocks(json.contentBlocks ?? []);
      setMeta(json.pageMeta);
      if ((json.contentBlocks?.length ?? 0) === 0 && json.pageMeta.fromDb === false) {
        setTab('text');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [apiSlug]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  async function saveContentBlocks() {
    await savePage({ contentBlocks }, 'Контент сохранён');
  }

  async function saveHtml() {
    await savePage({ html }, 'HTML сохранён');
  }

  async function saveSettings() {
    if (!meta) return;
    await savePage({
      published: meta.published,
      navSection: meta.navSection,
      categoryId: meta.categoryId,
      showInNav: meta.showInNav,
      sortOrder: meta.sortOrder,
      metaTitle: meta.metaTitle,
      metaDesc: meta.metaDesc,
    }, 'Настройки сохранены');
  }

  async function saveTextBlocks() {
    setSaving(true);
    setMessage('');
    try {
      const pageSlug = slugPath || 'home';
      const res = await fetch('/api/admin/text-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSlug, blocks: textBlocks }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Ошибка');
      setMessage('Текстовые правки сохранены');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
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
        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-white shrink-0">
          Открыть на сайте →
        </a>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        {(['content', 'text', 'html', 'settings'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${tab === t ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            {t === 'content' && 'Контент'}
            {t === 'text' && 'Текст HTML'}
            {t === 'html' && 'HTML код'}
            {t === 'settings' && 'Меню и SEO'}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {tab === 'content' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Блочный редактор: hero, текст, изображения и видео. Подходит для новых страниц.
          </p>
          <ContentBlocksEditor blocks={contentBlocks} onChange={setContentBlocks} />
          <button type="button" disabled={saving} onClick={() => void saveContentBlocks()} className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50">
            Сохранить контент
          </button>
        </div>
      )}

      {tab === 'text' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Точечные правки текста в существующем HTML.</p>
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {textBlocks.map((block, idx) => (
              <li key={block.blockKey} className="border border-zinc-800 rounded-lg p-3 space-y-2">
                <p className="text-xs text-zinc-500">{block.label}</p>
                <textarea
                  value={block.content}
                  onChange={(e) => {
                    const next = [...textBlocks];
                    next[idx] = { ...block, content: e.target.value };
                    setTextBlocks(next);
                  }}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                />
              </li>
            ))}
          </ul>
          <button type="button" disabled={saving} onClick={() => void saveTextBlocks()} className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50">
            Сохранить правки
          </button>
        </div>
      )}

      {tab === 'html' && (
        <div className="space-y-3">
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={24} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono" spellCheck={false} />
          <button type="button" disabled={saving} onClick={() => void saveHtml()} className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50">
            Сохранить HTML
          </button>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-lg">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={meta.published} onChange={(e) => setMeta({ ...meta, published: e.target.checked })} />
            Опубликована
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={meta.showInNav} onChange={(e) => setMeta({ ...meta, showInNav: e.target.checked })} />
            Показывать в меню
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Раздел меню</span>
            <select value={meta.navSection} onChange={(e) => setMeta({ ...meta, navSection: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              {NAV_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Категория</span>
            <select value={meta.categoryId ?? ''} onChange={(e) => setMeta({ ...meta, categoryId: e.target.value || null })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Порядок в меню</span>
            <input type="number" value={meta.sortOrder} onChange={(e) => setMeta({ ...meta, sortOrder: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Meta title</span>
            <input value={meta.metaTitle} onChange={(e) => setMeta({ ...meta, metaTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Meta description</span>
            <textarea value={meta.metaDesc} onChange={(e) => setMeta({ ...meta, metaDesc: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
          </label>
          <button type="button" disabled={saving} onClick={() => void saveSettings()} className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50">
            Сохранить настройки
          </button>
        </div>
      )}
    </div>
  );
}
