'use client';

import { FieldLabel, type CustomField } from '@puckeditor/core';
import { PALETTE, type ElementStyle } from '@/lib/cms/elements';

type Option = { value: string; label: string; title?: string };

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title ?? o.label}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-2 py-1 text-xs ${
            value === o.value
              ? 'border-sky-500 bg-sky-50 text-sky-800'
              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Swatch = { value: string; label: string; background: string; border?: string };

const NONE_SWATCH =
  'repeating-linear-gradient(45deg, #fff 0 4px, #e4e4e7 4px 8px)';

export function Swatches({
  value,
  onChange,
  extra = [],
  none,
}: {
  value: string;
  onChange: (value: string) => void;
  extra?: Swatch[];
  /** Подпись для варианта «не задано» (например, «Как в дизайне»); без неё вариант не показывается */
  none?: string;
}) {
  const swatches: Swatch[] = [
    ...(none ? [{ value: '', label: none, background: NONE_SWATCH }] : []),
    ...extra,
    ...PALETTE.map((c) => ({ value: c.key, label: c.label, background: c.hex })),
  ];
  const current = swatches.find((s) => s.value === (value ?? ''));
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((s) => (
          <button
            key={s.value || 'none'}
            type="button"
            title={s.label}
            onClick={() => onChange(s.value)}
            className={`h-7 w-7 rounded-full border ${
              (value ?? '') === s.value ? 'ring-2 ring-sky-500 ring-offset-1' : ''
            }`}
            style={{ background: s.background, borderColor: s.border ?? 'rgba(0,0,0,0.2)' }}
          />
        ))}
      </div>
      <p className="text-[11px] text-zinc-500">{current?.label ?? 'Не выбран'}</p>
    </div>
  );
}

/** Цвет из палитры сайта */
export function colorField(label: string, opts: { none?: string } = {}): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, field }) => (
      <FieldLabel label={field.label ?? label} el="div">
        <Swatches value={value ?? ''} onChange={onChange} none={opts.none} />
      </FieldLabel>
    ),
  };
}

const SPACE_OPTIONS: Option[] = [
  { value: '', label: '—', title: 'Нет' },
  { value: 'xs', label: 'XS' },
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
];

const ALIGN_OPTIONS: Option[] = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'Центр' },
  { value: 'right', label: 'Справа' },
  { value: 'stretch', label: 'На всю ширину' },
];

const BG_EXTRA: Swatch[] = [
  {
    value: 'glass',
    label: 'Стекло (как карточки сайта)',
    background: 'linear-gradient(135deg, #2c3a4c, #122131)',
    border: 'rgba(255,255,255,0.5)',
  },
  {
    value: 'accent',
    label: 'Акцент (синее свечение)',
    background: 'radial-gradient(circle at 50% 0%, #4d8eff, #1c2b3c 70%)',
  },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] font-medium text-zinc-600">{label}</span>
      {children}
    </div>
  );
}

function countChanges(style: ElementStyle): number {
  return Object.values(style).filter((v) => v !== undefined && v !== '' && v !== 'none').length;
}

export function StyleEditor({
  value,
  onChange,
  parts = 'all',
}: {
  value: ElementStyle;
  onChange: (value: ElementStyle) => void;
  parts?: 'all' | 'placement';
}) {
  const style = value ?? {};
  const set = (key: keyof ElementStyle, v: string) => {
    const next = { ...style, [key]: v || undefined } as ElementStyle;
    if (!v) delete next[key];
    onChange(next);
  };
  const changes = countChanges(style);

  return (
    <details className="rounded-md border border-zinc-200 bg-zinc-50/60" open={changes > 0 || undefined}>
      <summary className="cursor-pointer select-none px-2.5 py-2 text-xs font-semibold text-zinc-700">
        Оформление{changes ? ` · изменено: ${changes}` : ''}
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-2.5 py-3">
        <Row label="Выравнивание">
          <Segmented options={[{ value: '', label: 'Авто' }, ...ALIGN_OPTIONS]} value={style.align ?? ''} onChange={(v) => set('align', v)} />
        </Row>
        <Row label="Выравнивание на телефоне">
          <Segmented
            options={[{ value: '', label: 'Как на компьютере' }, ...ALIGN_OPTIONS]}
            value={style.alignMobile ?? ''}
            onChange={(v) => set('alignMobile', v)}
          />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Отступ сверху">
            <Segmented options={SPACE_OPTIONS} value={style.mt ?? ''} onChange={(v) => set('mt', v)} />
          </Row>
          <Row label="Отступ снизу">
            <Segmented options={SPACE_OPTIONS} value={style.mb ?? ''} onChange={(v) => set('mb', v)} />
          </Row>
        </div>
        <Row label="Максимальная ширина">
          <Segmented
            options={[
              { value: '', label: 'Без ограничения' },
              { value: 'xs', label: 'XS' },
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'l', label: 'L' },
            ]}
            value={style.maxWidth ?? ''}
            onChange={(v) => set('maxWidth', v)}
          />
        </Row>

        {parts === 'all' && (
          <>
            <Row label="Подложка (фон)">
              <Swatches value={style.bg ?? ''} onChange={(v) => set('bg', v)} extra={BG_EXTRA} none="Без фона" />
            </Row>
            <Row label="Внутренний отступ">
              <Segmented options={SPACE_OPTIONS} value={style.pad ?? ''} onChange={(v) => set('pad', v)} />
            </Row>
            <Row label="Цвет текста">
              <Swatches value={style.color ?? ''} onChange={(v) => set('color', v)} none="Как в дизайне" />
            </Row>
            <Row label="Скругление углов">
              <Segmented
                options={[
                  { value: '', label: 'Авто' },
                  { value: 'none', label: 'Нет' },
                  { value: 's', label: 'S' },
                  { value: 'm', label: 'M' },
                  { value: 'l', label: 'L' },
                  { value: 'full', label: 'Круглые' },
                ]}
                value={style.radius ?? ''}
                onChange={(v) => set('radius', v)}
              />
            </Row>
            <Row label="Рамка">
              <Segmented
                options={[
                  { value: '', label: 'Нет' },
                  { value: 'thin', label: 'Тонкая' },
                  { value: 'thick', label: 'Толстая' },
                ]}
                value={style.border ?? ''}
                onChange={(v) => set('border', v)}
              />
              {style.border && style.border !== 'none' && (
                <Swatches value={style.borderColor ?? ''} onChange={(v) => set('borderColor', v)} none="Серая (по умолчанию)" />
              )}
            </Row>
            <Row label="Тень">
              <Segmented
                options={[
                  { value: '', label: 'Нет' },
                  { value: 's', label: 'Лёгкая' },
                  { value: 'l', label: 'Глубокая' },
                  { value: 'glow', label: 'Свечение' },
                ]}
                value={style.shadow ?? ''}
                onChange={(v) => set('shadow', v)}
              />
            </Row>
          </>
        )}

        <Row label="Показывать">
          <Segmented
            options={[
              { value: '', label: 'Везде' },
              { value: 'desktop', label: 'Только на компьютере' },
              { value: 'mobile', label: 'Только на телефоне' },
            ]}
            value={style.hide === 'mobile' ? 'desktop' : style.hide === 'desktop' ? 'mobile' : ''}
            onChange={(v) => set('hide', v === 'desktop' ? 'mobile' : v === 'mobile' ? 'desktop' : '')}
          />
        </Row>
        {changes > 0 && (
          <button type="button" className="text-[11px] text-zinc-500 underline" onClick={() => onChange({})}>
            Сбросить оформление
          </button>
        )}
      </div>
    </details>
  );
}

export function styleField(parts: 'all' | 'placement' = 'all'): CustomField<ElementStyle> {
  return {
    type: 'custom',
    label: 'Оформление',
    render: ({ value, onChange }) => <StyleEditor value={value ?? {}} onChange={onChange} parts={parts} />,
  };
}
