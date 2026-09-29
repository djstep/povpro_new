'use client';

import { useState } from 'react';
import { FieldLabel, type CustomField } from '@puckeditor/core';
import { ACCEPT, useMedia, type LibKind } from '@/components/admin/builder/media';

export const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-sky-500';
export const smallBtnCls =
  'rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100 disabled:opacity-50';

function UploadButton({
  kind,
  label,
  onUploaded,
  onError,
}: {
  kind: LibKind;
  label: string;
  onUploaded: (src: string, filename: string) => void;
  onError: (message: string) => void;
}) {
  const media = useMedia();
  const [busy, setBusy] = useState(false);
  return (
    <label className={`${smallBtnCls} cursor-pointer`}>
      {busy ? 'Загрузка…' : label}
      <input
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          onError('');
          try {
            const item = await media.upload(file);
            onUploaded(item.src, item.filename);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Ошибка загрузки');
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

export function MediaInput({
  kind,
  value,
  onChange,
}: {
  kind: 'IMAGE' | 'VIDEO';
  value: string;
  onChange: (src: string) => void;
}) {
  const media = useMedia();
  const [error, setError] = useState('');
  return (
    <div className="space-y-2 text-zinc-900">
      {value ? (
        kind === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.previewSrc(value)}
            alt=""
            className="w-full max-h-40 rounded-md object-contain bg-zinc-100 border border-zinc-200"
          />
        ) : (
          <video src={value} className="w-full max-h-40 rounded-md bg-zinc-900" muted />
        )
      ) : (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-center text-xs text-zinc-500">
          {kind === 'IMAGE' ? 'Фото не выбрано' : 'Видео не выбрано'}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={smallBtnCls}
          onClick={async () => {
            const item = await media.pick(kind);
            if (item) onChange(item.src);
          }}
        >
          Из библиотеки
        </button>
        <UploadButton kind={kind} label="Загрузить" onUploaded={(src) => onChange(src)} onError={setError} />
        {value && (
          <button type="button" className={smallBtnCls} onClick={() => onChange('')}>
            Убрать
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const LINK_PRESETS = [
  { label: 'Страница заявки', href: '/zakaz' },
  { label: 'Контакты', href: '/contacts' },
  { label: 'Главная', href: '/' },
];

export function LinkInput({
  value,
  onChange,
  onLabel,
}: {
  value: string;
  onChange: (href: string) => void;
  /** Подсказка для текста кнопки при выборе PDF */
  onLabel?: (label: string) => void;
}) {
  const media = useMedia();
  const [error, setError] = useState('');
  return (
    <div className="space-y-1.5 text-zinc-900">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/zakaz, https://… или PDF"
        className={`${inputCls} font-mono text-xs`}
      />
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={smallBtnCls}
          onClick={async () => {
            const item = await media.pick('DOCUMENT');
            if (!item) return;
            onChange(item.src);
            if (item.source === 'site') onLabel?.(item.filename);
          }}
        >
          PDF из библиотеки
        </button>
        <UploadButton kind="DOCUMENT" label="Загрузить PDF" onUploaded={(src) => onChange(src)} onError={setError} />
        <select
          value=""
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-800"
        >
          <option value="">Страница сайта…</option>
          {LINK_PRESETS.map((p) => (
            <option key={p.href} value={p.href}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const ICONS = [
  'precision_manufacturing',
  'settings',
  'build',
  'engineering',
  'factory',
  'construction',
  'handyman',
  'hardware',
  'architecture',
  'straighten',
  'tune',
  'bolt',
  'speed',
  'verified',
  'workspace_premium',
  'shield',
  'schedule',
  'local_shipping',
  'inventory_2',
  'support_agent',
  'groups',
  'thumb_up',
  'star',
  'check_circle',
  'payments',
  'description',
  'science',
  'directions_car',
  'agriculture',
  'phone',
  'mail',
  'location_on',
];

export function IconInput({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div className="space-y-2 text-zinc-900">
      <div className="grid grid-cols-8 gap-1">
        <button
          type="button"
          title="Без иконки"
          onClick={() => onChange('')}
          className={`h-8 rounded-md border text-[10px] ${!value ? 'border-sky-500 bg-sky-50' : 'border-zinc-200 hover:bg-zinc-100'}`}
        >
          нет
        </button>
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            title={icon}
            onClick={() => onChange(icon)}
            className={`h-8 rounded-md border flex items-center justify-center ${
              value === icon ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {icon}
            </span>
          </button>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="Другая иконка (название с fonts.google.com/icons)"
        className={`${inputCls} text-xs`}
      />
    </div>
  );
}

export function mediaField(label: string, kind: 'IMAGE' | 'VIDEO'): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, field }) => (
      <FieldLabel label={field.label ?? label} el="div">
        <MediaInput kind={kind} value={value ?? ''} onChange={onChange} />
      </FieldLabel>
    ),
  };
}

export function linkField(label: string): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, field }) => (
      <FieldLabel label={field.label ?? label} el="div">
        <LinkInput value={value ?? ''} onChange={onChange} />
      </FieldLabel>
    ),
  };
}

export function iconField(label: string): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, field }) => (
      <FieldLabel label={field.label ?? label} el="div">
        <IconInput value={value ?? ''} onChange={onChange} />
      </FieldLabel>
    ),
  };
}
