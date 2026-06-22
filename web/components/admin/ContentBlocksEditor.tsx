'use client';

import { useCallback, useEffect, useState } from 'react';
import { newBlockId, type ContentBlock } from '@/lib/cms/content-blocks';

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
};

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero-блок' },
  { type: 'heading', label: 'Заголовок' },
  { type: 'text', label: 'Текст' },
  { type: 'image', label: 'Изображение' },
  { type: 'video', label: 'Видео' },
  { type: 'html', label: 'HTML' },
] as const;

export function ContentBlocksEditor({ blocks, onChange }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);

  function updateBlock(index: number, patch: Partial<ContentBlock>) {
    const next = [...blocks];
    next[index] = { ...next[index], ...patch } as ContentBlock;
    onChange(next);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addBlock(type: ContentBlock['type']) {
    const id = newBlockId();
    let block: ContentBlock;
    switch (type) {
      case 'hero':
        block = { id, type: 'hero', title: 'Заголовок', subtitle: '' };
        break;
      case 'heading':
        block = { id, type: 'heading', level: 2, text: 'Заголовок' };
        break;
      case 'text':
        block = { id, type: 'text', content: '<p>Текст</p>' };
        break;
      case 'image':
        block = { id, type: 'image', src: '/assets/img/placeholder.svg', alt: '' };
        break;
      case 'video':
        block = { id, type: 'video', src: '' };
        break;
      case 'html':
        block = { id, type: 'html', content: '<div></div>' };
        break;
      default:
        return;
    }
    onChange([...blocks, block]);
  }

  const uploadForBlock = useCallback(async (index: number, file: File) => {
    setUploading(blocks[index]?.id ?? String(index));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { path?: string; error?: string };
      if (data.path) {
        updateBlock(index, { src: data.path } as Partial<ContentBlock>);
      }
    } finally {
      setUploading(null);
    }
  }, [blocks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => addBlock(t.type)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-900"
          >
            + {t.label}
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {blocks.map((block, index) => (
          <li key={block.id} className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 uppercase">{block.type}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveBlock(index, -1)} className="px-2 py-1 text-xs border border-zinc-700 rounded">↑</button>
                <button type="button" onClick={() => moveBlock(index, 1)} className="px-2 py-1 text-xs border border-zinc-700 rounded">↓</button>
                <button type="button" onClick={() => removeBlock(index)} className="px-2 py-1 text-xs border border-red-900 text-red-400 rounded">×</button>
              </div>
            </div>

            {block.type === 'hero' && (
              <>
                <input value={block.title} onChange={(e) => updateBlock(index, { title: e.target.value })} placeholder="Заголовок" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                <input value={block.subtitle ?? ''} onChange={(e) => updateBlock(index, { subtitle: e.target.value })} placeholder="Подзаголовок" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                <input value={block.badge ?? ''} onChange={(e) => updateBlock(index, { badge: e.target.value })} placeholder="Бейдж (необязательно)" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                <input value={block.image ?? ''} onChange={(e) => updateBlock(index, { image: e.target.value })} placeholder="URL изображения" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
              </>
            )}

            {block.type === 'heading' && (
              <>
                <select value={block.level} onChange={(e) => updateBlock(index, { level: Number(e.target.value) as 1 | 2 | 3 })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm">
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <input value={block.text} onChange={(e) => updateBlock(index, { text: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
              </>
            )}

            {(block.type === 'text' || block.type === 'html') && (
              <textarea value={block.content} onChange={(e) => updateBlock(index, { content: e.target.value })} rows={6} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
            )}

            {block.type === 'image' && (
              <>
                <input value={block.src} onChange={(e) => updateBlock(index, { src: e.target.value })} placeholder="URL" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
                <input value={block.alt ?? ''} onChange={(e) => updateBlock(index, { alt: e.target.value })} placeholder="Alt" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                <input value={block.caption ?? ''} onChange={(e) => updateBlock(index, { caption: e.target.value })} placeholder="Подпись" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                <label className="inline-block text-xs border border-zinc-600 rounded px-3 py-1.5 cursor-pointer">
                  {uploading === block.id ? 'Загрузка…' : 'Загрузить файл'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadForBlock(index, f); }} />
                </label>
              </>
            )}

            {block.type === 'video' && (
              <>
                <input value={block.src} onChange={(e) => updateBlock(index, { src: e.target.value })} placeholder="URL видео (mp4 или embed)" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
                <input value={block.poster ?? ''} onChange={(e) => updateBlock(index, { poster: e.target.value })} placeholder="Poster URL" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono" />
                <label className="inline-block text-xs border border-zinc-600 rounded px-3 py-1.5 cursor-pointer">
                  {uploading === block.id ? 'Загрузка…' : 'Загрузить видео'}
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadForBlock(index, f); }} />
                </label>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
