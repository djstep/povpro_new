'use client';

import { useState } from 'react';

type Review = {
  id: string;
  author: string;
  company: string | null;
  email: string | null;
  text: string;
  rating: number | null;
  published: boolean;
  createdAt: string;
};

export function ReviewAdminList({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function setPublished(id: string, published: boolean) {
    setMessage('');
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const data = (await res.json()) as { review?: Review; error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === 'string' ? data.error : 'Ошибка');
        return;
      }
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, published } : r)));
      setMessage(published ? 'Опубликовано' : 'Снято с публикации');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Удалить отзыв безвозвратно?')) return;
    setMessage('');
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === 'string' ? data.error : 'Ошибка');
        return;
      }
      setItems((prev) => prev.filter((r) => r.id !== id));
      setMessage('Удалено');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">
                {r.author}
                {r.company ? ` — ${r.company}` : ''}
              </span>
              <time className="text-zinc-500">{new Date(r.createdAt).toLocaleString('ru-RU')}</time>
            </div>
            {r.email && <p className="text-zinc-400 text-sm">{r.email}</p>}
            <p className="text-zinc-300 whitespace-pre-wrap">{r.text}</p>
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-zinc-800">
              <span
                className={`text-xs rounded-full px-2 py-0.5 ${
                  r.published
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950/40 text-amber-400 border border-amber-800'
                }`}
              >
                {r.published ? 'Опубликован' : 'На модерации'}
              </span>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => void setPublished(r.id, !r.published)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm hover:border-zinc-500 disabled:opacity-50"
              >
                {r.published ? 'Снять с публикации' : 'Опубликовать'}
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => void remove(r.id)}
                className="rounded-lg border border-red-900 text-red-400 px-3 py-1 text-sm hover:border-red-600 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
