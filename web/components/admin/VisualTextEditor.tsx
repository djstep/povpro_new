'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildAnnotatedTextPreview } from '@/lib/cms/extract-blocks';

export type VisualTextBlock = {
  blockKey: string;
  label: string;
  originalText: string;
  content: string;
  saved: boolean;
};

type Props = {
  pageSlug: string;
  baseHtml: string;
  blocks: VisualTextBlock[];
  onChange: (blocks: VisualTextBlock[]) => void;
  onSave: () => Promise<void>;
  onReload: () => Promise<void>;
  saving: boolean;
};

type DraftPayload = {
  savedAt: number;
  blocks: { blockKey: string; content: string }[];
};

function draftStorageKey(pageSlug: string) {
  return `povpro-admin-text-draft:${pageSlug || 'home'}`;
}

function blocksSignature(blocks: VisualTextBlock[]) {
  return blocks.map((b) => `${b.blockKey}\0${b.content}`).join('\n');
}

export function VisualTextEditor({
  pageSlug,
  baseHtml,
  blocks,
  onChange,
  onSave,
  onReload,
  saving,
}: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [serverSignature, setServerSignature] = useState(() => blocksSignature(blocks));
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const draftApplied = useRef(false);

  const dirty = blocksSignature(blocks) !== serverSignature;

  const annotatedHtml = useMemo(
    () => buildAnnotatedTextPreview(baseHtml, blocks, activeKey),
    [baseHtml, blocks, activeKey],
  );

  useEffect(() => {
    if (draftApplied.current) return;
    draftApplied.current = true;
    setServerSignature(blocksSignature(blocks));
    try {
      const raw = localStorage.getItem(draftStorageKey(pageSlug));
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftPayload;
      if (!parsed?.blocks?.length) return;
      const map = new Map(parsed.blocks.map((b) => [b.blockKey, b.content]));
      let changed = false;
      const next = blocks.map((b) => {
        const draftContent = map.get(b.blockKey);
        if (draftContent !== undefined && draftContent !== b.content) {
          changed = true;
          return { ...b, content: draftContent };
        }
        return b;
      });
      if (changed) {
        onChange(next);
        setDraftNote('Восстановлен локальный черновик');
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!dirty) {
        localStorage.removeItem(draftStorageKey(pageSlug));
        return;
      }
      const payload: DraftPayload = {
        savedAt: Date.now(),
        blocks: blocks.map((b) => ({ blockKey: b.blockKey, content: b.content })),
      };
      localStorage.setItem(draftStorageKey(pageSlug), JSON.stringify(payload));
      setDraftNote('Черновик сохранён локально');
    }, 600);
    return () => window.clearTimeout(timer);
  }, [blocks, dirty, pageSlug]);

  useEffect(() => {
    if (!activeKey || !previewRef.current) return;
    const el = previewRef.current.querySelector(`[data-cms-block="${CSS.escape(activeKey)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeKey, annotatedHtml]);

  const activeBlock = blocks.find((b) => b.blockKey === activeKey) ?? null;
  const activeIndex = activeBlock ? blocks.findIndex((b) => b.blockKey === activeKey) : -1;

  const updateActiveContent = useCallback(
    (content: string) => {
      if (activeIndex < 0) return;
      const next = [...blocks];
      next[activeIndex] = { ...next[activeIndex], content };
      onChange(next);
    },
    [activeIndex, blocks, onChange],
  );

  function onPreviewClick(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest('[data-cms-block]');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    const key = target.getAttribute('data-cms-block');
    if (!key) return;
    setActiveKey(key);
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  async function handleSave() {
    await onSave();
    localStorage.removeItem(draftStorageKey(pageSlug));
    setDraftNote('');
    setServerSignature(blocksSignature(blocks));
  }

  async function handleDiscard() {
    localStorage.removeItem(draftStorageKey(pageSlug));
    setDraftNote('');
    setActiveKey(null);
    draftApplied.current = false;
    await onReload();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm space-y-0.5">
          <p className="text-zinc-400">
            Кликните по тексту на превью слева — откроется поле редактирования.
          </p>
          <p className="text-xs">
            {dirty ? (
              <span className="text-amber-400">Есть несохранённые правки</span>
            ) : (
              <span className="text-emerald-500">Сохранено</span>
            )}
            {draftNote ? <span className="text-zinc-500"> · {draftNote}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => void handleDiscard()}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
            className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[70vh]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500 shrink-0">
            Превью страницы
          </div>
          <div
            ref={previewRef}
            className="cms-text-preview flex-1 overflow-auto max-h-[75vh] p-4 bg-[#0c0e12]"
            onClick={onPreviewClick}
            dangerouslySetInnerHTML={{ __html: annotatedHtml }}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col min-h-[20rem]">
          <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500 shrink-0">
            Редактирование
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {activeBlock ? (
              <>
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-300 self-start"
                  onClick={() => setActiveKey(null)}
                >
                  ← К списку фрагментов
                </button>
                <p className="text-sm text-zinc-200 font-medium">{activeBlock.label}</p>
                <textarea
                  ref={editorRef}
                  value={activeBlock.content}
                  onChange={(e) => updateActiveContent(e.target.value)}
                  rows={10}
                  className="w-full flex-1 min-h-[12rem] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-relaxed"
                />
                <p className="text-xs text-zinc-500">
                  Изменения сразу видны на превью. «Сохранить» публикует правки на сайте.
                </p>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-zinc-500">
                  Выберите фрагмент на превью или из списка ниже.
                </p>
                <ul className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                  {blocks.map((block) => {
                    const changed = block.content !== block.originalText;
                    return (
                      <li key={block.blockKey}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveKey(block.blockKey);
                            requestAnimationFrame(() => editorRef.current?.focus());
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-sm border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
                        >
                          <span className="text-zinc-200">{block.label}</span>
                          {changed ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-400">
                              изменено
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
