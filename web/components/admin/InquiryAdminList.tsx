'use client';

import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Закрыта',
  ARCHIVED: 'Архив',
};

type Inquiry = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export function InquiryAdminList({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState('');

  async function updateInquiry(id: string, patch: { status?: string; adminNote?: string }) {
    setMessage('');
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as { inquiry?: Inquiry; error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Ошибка');
      return;
    }
    if (data.inquiry) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.inquiry! } : i)));
      setMessage('Обновлено');
    }
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <ul className="space-y-3">
        {items.map((q) => (
          <li key={q.id} className="border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">{q.name}</span>
              <time className="text-zinc-500">{new Date(q.createdAt).toLocaleString('ru-RU')}</time>
            </div>
            {q.phone && <p>{q.phone}</p>}
            {q.email && <p className="text-zinc-300">{q.email}</p>}
            {q.source && <p className="text-xs text-zinc-500">Источник: {q.source}</p>}
            {q.message && <p className="text-zinc-300 whitespace-pre-wrap">{q.message}</p>}
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-zinc-800">
              <select
                value={q.status}
                onChange={(e) => void updateInquiry(q.id, { status: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Заметка менеджера"
                defaultValue={q.adminNote ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (q.adminNote ?? '')) {
                    void updateInquiry(q.id, { adminNote: e.target.value });
                  }
                }}
                className="flex-1 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
