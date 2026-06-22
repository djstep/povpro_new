'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type PageRow = {
  slug: string;
  title: string;
  source: 'static' | 'db';
  url: string;
  dbId: string | null;
  published?: boolean;
  showInNav?: boolean;
  navSection?: string;
  categoryId?: string | null;
  isProtected?: boolean;
};

type CategoryRow = {
  id: string;
  title: string;
  navSection: string;
  parentId: string | null;
  sortOrder: number;
  pagesCount?: number;
};

const NAV_SECTIONS = [
  { value: 'NONE', label: 'Не в меню' },
  { value: 'FRICTION', label: 'Фрикционные накладки' },
  { value: 'MECH', label: 'Мехобработка' },
  { value: 'USLUGI', label: 'Услуги' },
  { value: 'TOP_LINK', label: 'Верхнее меню' },
];

function editHref(slug: string): string {
  const segment = slug === '' ? 'home' : slug;
  return `/admin/pages/${segment.split('/').map(encodeURIComponent).join('/')}`;
}

export function PageStructureAdmin() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const [newPage, setNewPage] = useState({
    title: '',
    slugSegment: '',
    parentSlug: '',
    navSection: 'MECH',
    categoryId: '',
    showInNav: true,
  });

  const [newCategory, setNewCategory] = useState({
    title: '',
    navSection: 'MECH',
    parentId: '',
    sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      const data = (await res.json()) as { pages?: PageRow[]; categories?: CategoryRow[] };
      setPages(data.pages ?? []);
      setCategories(data.categories ?? []);
    } catch {
      setMessage('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newPage,
        categoryId: newPage.categoryId || null,
        parentSlug: newPage.parentSlug || undefined,
      }),
    });
    const data = (await res.json()) as { error?: string; page?: { slug: string } };
    if (!res.ok) {
      setMessage(data.error ?? 'Ошибка');
      return;
    }
    setMessage('Страница создана');
    setShowCreatePage(false);
    setNewPage({ title: '', slugSegment: '', parentSlug: '', navSection: 'MECH', categoryId: '', showInNav: true });
    await load();
    if (data.page?.slug) {
      window.location.href = editHref(data.page.slug);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCategory,
        parentId: newCategory.parentId || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Ошибка');
      return;
    }
    setMessage('Категория создана');
    setShowCreateCategory(false);
    setNewCategory({ title: '', navSection: 'MECH', parentId: '', sortOrder: 0 });
    await load();
  }

  async function deletePage(slug: string) {
    if (!confirm(`Удалить страницу /${slug}?`)) return;
    const segment = slug === '' ? 'home' : slug;
    const res = await fetch(`/api/admin/pages/${segment.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'DELETE',
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Не удалось удалить');
      return;
    }
    setMessage('Страница удалена');
    await load();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Удалить категорию? Страницы останутся без категории.')) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage('Категория удалена');
      await load();
    }
  }

  if (loading) return <p className="text-zinc-500">Загрузка…</p>;

  return (
    <div className="space-y-8">
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Категории меню</h2>
          <button type="button" onClick={() => setShowCreateCategory((v) => !v)} className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-sm font-medium">
            + Категория
          </button>
        </div>
        {showCreateCategory && (
          <form onSubmit={createCategory} className="border border-zinc-800 rounded-xl p-4 grid gap-3 sm:grid-cols-2">
            <input required value={newCategory.title} onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })} placeholder="Название категории" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm sm:col-span-2" />
            <select value={newCategory.navSection} onChange={(e) => setNewCategory({ ...newCategory, navSection: e.target.value })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              {NAV_SECTIONS.filter((s) => s.value !== 'NONE' && s.value !== 'TOP_LINK').map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select value={newCategory.parentId} onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              <option value="">Без родительской категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium sm:col-span-2 w-fit">Создать</button>
          </form>
        )}
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 rounded-lg px-4 py-3 text-sm">
              <span>{c.title} <span className="text-zinc-500">({NAV_SECTIONS.find((s) => s.value === c.navSection)?.label})</span></span>
              <button type="button" onClick={() => void deleteCategory(c.id)} className="text-xs text-red-400">Удалить</button>
            </li>
          ))}
          {categories.length === 0 && <p className="text-zinc-600 text-sm">Категорий пока нет — создайте подкатегорию для группировки страниц в меню.</p>}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Страницы</h2>
          <button type="button" onClick={() => setShowCreatePage((v) => !v)} className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-sm font-medium">
            + Новая страница
          </button>
        </div>

        {showCreatePage && (
          <form onSubmit={createPage} className="border border-zinc-800 rounded-xl p-4 grid gap-3 sm:grid-cols-2">
            <input required value={newPage.title} onChange={(e) => setNewPage({ ...newPage, title: e.target.value })} placeholder="Название страницы" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm sm:col-span-2" />
            <input value={newPage.slugSegment} onChange={(e) => setNewPage({ ...newPage, slugSegment: e.target.value })} placeholder="URL (латиница, необязательно)" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
            <input value={newPage.parentSlug} onChange={(e) => setNewPage({ ...newPage, parentSlug: e.target.value })} placeholder="Родительский slug (необяз.)" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
            <select value={newPage.navSection} onChange={(e) => setNewPage({ ...newPage, navSection: e.target.value })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              {NAV_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select value={newPage.categoryId} onChange={(e) => setNewPage({ ...newPage, categoryId: e.target.value })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={newPage.showInNav} onChange={(e) => setNewPage({ ...newPage, showInNav: e.target.checked })} />
              Показывать в меню
            </label>
            <button type="submit" className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium sm:col-span-2 w-fit">Создать и редактировать</button>
          </form>
        )}

        <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
          <thead className="bg-zinc-900 text-left">
            <tr>
              <th className="p-3">URL</th>
              <th className="p-3">Название</th>
              <th className="p-3">Раздел</th>
              <th className="p-3">Источник</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug + p.source} className="border-t border-zinc-800">
                <td className="p-3 font-mono text-xs">{p.url}</td>
                <td className="p-3">{p.title}</td>
                <td className="p-3 text-zinc-500">{NAV_SECTIONS.find((s) => s.value === p.navSection)?.label ?? '—'}</td>
                <td className="p-3 text-zinc-500">{p.source === 'db' ? 'БД' : 'Файл'}</td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <Link href={editHref(p.slug)} className="text-primary hover:underline text-xs">Редактировать</Link>
                  {p.source === 'db' && !p.isProtected && (
                    <button type="button" onClick={() => void deletePage(p.slug)} className="text-xs text-red-400">Удалить</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
