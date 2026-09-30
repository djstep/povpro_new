'use client';

import { useMemo } from 'react';
import {
  FieldLabel,
  createUsePuck,
  type Config,
  type CustomField,
  type Field,
  type RichtextField,
  type SlotComponent,
} from '@puckeditor/core';
import { renderBlockHtml, type ContentBlock } from '@/lib/cms/content-blocks';
import {
  applyPlace,
  containerParts,
  freeParts,
  isDims,
  isIconUrl,
  isPlace,
  partsToReact,
  type Dims,
  type ElementBlock,
  type Parts,
  type Place,
} from '@/lib/cms/elements';
import { measurePlace } from '@/components/admin/builder/FreeDrag';
import { SITE_FRAGMENT_TYPE, SITE_SECTION_TYPE } from '@/lib/cms/builder-data';
import { HtmlNode, parseOpenTag, useCanvasRef } from '@/components/admin/builder/HtmlNode';
import { useMedia } from '@/components/admin/builder/media';
import { IconInput, MediaInput, iconField, inputCls, linkField, mediaField } from '@/components/admin/builder/fields';
import { Segmented, colorField, styleField } from '@/components/admin/builder/StyleField';
import { siteSectionField } from '@/components/admin/builder/SiteSectionField';

type ComponentCfg = Config['components'][string];
type DragRef = ((el: Element | null) => void) | null | undefined;
type RenderProps = Record<string, unknown> & { puck?: { dragRef?: DragRef } };

/** Готовые блоки со своей секцией — внутрь контейнеров их не кладём */
export const SLOT_DISALLOW = [
  'hero',
  'title',
  'textMedia',
  'cards',
  'buttons',
  'cta',
  'gallery',
  'videoSection',
  'stats',
  SITE_SECTION_TYPE,
];

const slot = (): Field => ({ type: 'slot', disallow: SLOT_DISALLOW });

function stripPuck(props: RenderProps): Record<string, unknown> {
  const rest = { ...props };
  delete rest.puck;
  delete rest.editMode;
  return rest;
}

function asElement(type: ElementBlock['type'], props: RenderProps): ElementBlock {
  return { ...stripPuck(props), type } as unknown as ElementBlock;
}

function withPlace(parts: Parts, props: RenderProps): Parts {
  const p = freeParts(props.place, props.dims);
  return { cls: [...parts.cls, ...p.cls], css: [...parts.css, ...p.css] };
}

/* ---------- Превью элементов ---------- */

function ElementPreview({ type, props, label }: { type: string; props: RenderProps; label: string }) {
  const media = useMedia();
  const html = media.previewHtml(renderBlockHtml({ ...stripPuck(props), type } as ContentBlock));
  return <HtmlNode html={html} dragRef={props.puck?.dragRef} emptyLabel={`«${label}» — заполните справа`} />;
}

function atom(type: string, label: string) {
  function Render(props: RenderProps) {
    return <ElementPreview type={type} props={props} label={label} />;
  }
  Render.displayName = `Element_${type}`;
  return Render;
}

function GroupRender(props: RenderProps) {
  const Content = props.content as SlotComponent;
  const { outer } = containerParts(asElement('elGroup', props));
  const ref = useCanvasRef(props.puck?.dragRef);
  return <Content as="div" {...partsToReact(withPlace(outer, props))} ref={ref} minEmptyHeight={64} />;
}

function SectionRender(props: RenderProps) {
  const Content = props.content as SlotComponent;
  const { outer, inner } = containerParts(asElement('elSection', props));
  const ref = useCanvasRef(props.puck?.dragRef);
  const o = partsToReact(withPlace(outer, props));
  return (
    <section ref={ref} className={o.className} style={o.style}>
      <Content as="div" {...partsToReact(inner)} minEmptyHeight={96} />
    </section>
  );
}

function ColumnsRender(props: RenderProps) {
  const { outer, inner, cols = 2 } = containerParts(asElement('elColumns', props));
  const ref = useCanvasRef(props.puck?.dragRef);
  const o = partsToReact(withPlace(outer, props));
  const i = partsToReact(inner);
  const slots = [props.col1, props.col2, props.col3, props.col4].slice(0, cols) as SlotComponent[];
  return (
    <div ref={ref} className={o.className} style={o.style}>
      {slots.map((Col, index) => (
        <Col key={index} as="div" className={i.className} minEmptyHeight={80} />
      ))}
    </div>
  );
}

function BoxRender(props: RenderProps) {
  const Content = props.content as SlotComponent;
  const open = String(props.open ?? '<div>');
  const { tag, className, style } = useMemo(() => parseOpenTag(open), [open]);
  const ref = useCanvasRef(props.puck?.dragRef);
  const place = partsToReact(freeParts(props.place, props.dims));
  return (
    <Content
      as={tag as 'div'}
      className={[className, place.className].filter(Boolean).join(' ')}
      style={{ ...style, ...place.style }}
      ref={ref}
      minEmptyHeight={48}
    />
  );
}

function FragmentRender(props: RenderProps) {
  const media = useMedia();
  const html = media.previewHtml(applyPlace(String(props.content ?? ''), props.place, props.dims));
  return <HtmlNode html={html} dragRef={props.puck?.dragRef} emptyLabel="Пустой элемент" />;
}

/* ---------- Поля ---------- */

const yesNo = (label: string): Field => ({
  type: 'radio',
  label,
  options: [
    { label: 'Да', value: 'yes' },
    { label: 'Нет', value: 'no' },
  ],
});

const richText: RichtextField = {
  type: 'richtext',
  label: 'Текст',
  contentEditable: false,
  options: {
    heading: { levels: [2, 3] as (1 | 2 | 3 | 4 | 5 | 6)[] },
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
  },
};

const gapField: Field = {
  type: 'select',
  label: 'Расстояние между элементами',
  options: [
    { label: 'Нет', value: 'none' },
    { label: 'Очень маленькое', value: 'xs' },
    { label: 'Маленькое', value: 's' },
    { label: 'Среднее', value: 'm' },
    { label: 'Большое', value: 'l' },
    { label: 'Очень большое', value: 'xl' },
  ],
};

const layoutFields: Record<string, Field> = {
  direction: {
    type: 'radio',
    label: 'Расположение элементов',
    options: [
      { label: 'Друг под другом', value: 'col' },
      { label: 'В ряд', value: 'row' },
    ],
  },
  gap: gapField,
  justify: {
    type: 'select',
    label: 'Распределение по главной оси',
    options: [
      { label: 'В начале', value: 'start' },
      { label: 'По центру', value: 'center' },
      { label: 'В конце', value: 'end' },
      { label: 'Разнести по краям', value: 'between' },
    ],
  },
  alignItems: {
    type: 'select',
    label: 'Выравнивание элементов',
    options: [
      { label: 'Растянуть', value: 'stretch' },
      { label: 'К началу', value: 'start' },
      { label: 'По центру', value: 'center' },
      { label: 'К концу', value: 'end' },
    ],
  },
  wrap: yesNo('Переносить на новую строку, если не помещается'),
  mobileStack: yesNo('На телефоне — друг под другом'),
};

function resolveLayoutFields(direction: unknown, fields: Record<string, Field>) {
  const next = { ...fields };
  if (direction !== 'row') {
    delete next.wrap;
    delete next.mobileStack;
  }
  return next;
}

const ratioField: Field = {
  type: 'select',
  label: 'Пропорции',
  options: [
    { label: 'Как есть', value: 'auto' },
    { label: 'Широкое 16:9', value: '16-9' },
    { label: 'Классическое 4:3', value: '4-3' },
    { label: 'Квадрат 1:1', value: '1-1' },
    { label: 'Вертикальное 3:4', value: '3-4' },
  ],
};

const roundedField: Field = {
  type: 'radio',
  label: 'Скругление углов',
  options: [
    { label: 'Нет', value: 'none' },
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
  ],
};

const mediaSizeField: Field = {
  type: 'select',
  label: 'Ширина',
  options: [
    { label: 'Во всю ширину', value: 'full' },
    { label: 'Большая', value: 'l' },
    { label: 'Средняя', value: 'm' },
    { label: 'Маленькая', value: 's' },
    { label: 'Миниатюра', value: 'xs' },
  ],
};

export const buttonVariantOptions = [
  { label: 'Залитая кнопка', value: 'filled' },
  { label: 'Контурная кнопка', value: 'outline' },
  { label: 'Мягкая (полупрозрачная)', value: 'soft' },
  { label: 'Стеклянная (как на сайте)', value: 'glass' },
  { label: 'Текст + стрелка', value: 'arrow' },
  { label: 'Подчёркнутая ссылка', value: 'link' },
  { label: 'Только иконка (круглая)', value: 'icon' },
];

export const buttonShapeField: Field = {
  type: 'radio',
  label: 'Форма',
  options: [
    { label: 'Прямоугольная', value: 'square' },
    { label: 'Скруглённая', value: 'rounded' },
    { label: 'Капсула', value: 'pill' },
  ],
};

export const buttonSizeField: Field = {
  type: 'radio',
  label: 'Размер',
  options: [
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
  ],
};

export const buttonIconField: CustomField<string> = {
  type: 'custom',
  label: 'Иконка',
  render: ({ value, onChange }) => {
    const current = value ?? 'auto';
    const mode = current === 'auto' ? 'auto' : current === '' ? 'none' : 'custom';
    return (
      <FieldLabel label="Иконка" el="div">
        <div className="space-y-2">
          <Segmented
            options={[
              { value: 'auto', label: 'Авто', title: 'Стрелка, для PDF — значок презентации' },
              { value: 'none', label: 'Без иконки' },
              { value: 'custom', label: 'Выбрать' },
            ]}
            value={mode}
            onChange={(v) => onChange(v === 'auto' ? 'auto' : v === 'none' ? '' : 'arrow_forward')}
          />
          {mode === 'custom' && <IconInput value={current} onChange={(icon) => onChange(icon || 'arrow_forward')} />}
        </div>
      </FieldLabel>
    );
  },
};

export const iconPositionField: Field = {
  type: 'radio',
  label: 'Иконка',
  options: [
    { label: 'Слева от текста', value: 'left' },
    { label: 'Справа от текста', value: 'right' },
  ],
};

const videoSrcField: CustomField<string> = {
  type: 'custom',
  label: 'Видео',
  render: ({ value, onChange }) => (
    <FieldLabel label="Видео" el="div">
      <div className="space-y-2">
        <MediaInput kind="VIDEO" value={/^https?:\/\//i.test(value ?? '') ? '' : (value ?? '')} onChange={onChange} />
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…или ссылка на YouTube / Rutube / Vimeo"
          className={`${inputCls} text-xs`}
        />
      </div>
    </FieldLabel>
  ),
};

const boxTagField: CustomField<string> = {
  type: 'custom',
  label: 'Контейнер',
  render: ({ value, onChange }) => (
    <FieldLabel label="Контейнер" el="div">
      <div className="space-y-2 text-zinc-900">
        <p className="text-xs leading-relaxed text-zinc-500">
          Часть исходной вёрстки сайта. Внутрь можно перетаскивать новые элементы из списка слева, а
          элементы внутри — двигать, копировать и удалять. Тексты и фото меняются у самих элементов.
        </p>
        <details className="rounded-md border border-zinc-200">
          <summary className="cursor-pointer px-2 py-1.5 text-xs text-zinc-600">Открывающий тег (для опытных)</summary>
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full border-t border-zinc-200 px-2 py-1.5 font-mono text-[11px] outline-none"
          />
        </details>
      </div>
    </FieldLabel>
  ),
};

const COLUMN_RATIO_OPTIONS: Record<number, { label: string; value: string }[]> = {
  2: [
    { label: 'Поровну', value: 'equal' },
    { label: '1 : 2', value: '1-2' },
    { label: '2 : 1', value: '2-1' },
    { label: '1 : 3', value: '1-3' },
    { label: '3 : 1', value: '3-1' },
  ],
  3: [
    { label: 'Поровну', value: 'equal' },
    { label: '1 : 2 : 1', value: '1-2-1' },
    { label: '2 : 1 : 1', value: '2-1-1' },
    { label: '1 : 1 : 2', value: '1-1-2' },
  ],
  4: [{ label: 'Поровну', value: 'equal' }],
};

const useSelectedId = createUsePuck();

function NumberBox({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-600">
      {label}
      <input
        type="number"
        value={value}
        step={suffix === '%' ? 0.5 : 1}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className={`${inputCls} w-20 px-1.5 py-1 text-xs`}
      />
      {suffix}
    </label>
  );
}

function PlaceEditor({ value, onChange }: { value: unknown; onChange: (v: Place | undefined) => void }) {
  const id = useSelectedId((s) => s.selectedItem?.props?.id as string | undefined);
  const place = isPlace(value) ? value : null;
  return (
    <div className="space-y-2.5 text-zinc-900">
      <Segmented
        options={[
          { value: 'flow', label: 'По порядку' },
          { value: 'free', label: 'Свободно (двигать мышью)' },
        ]}
        value={place ? 'free' : 'flow'}
        onChange={(v) => {
          if (v === 'free' && !place && id) onChange(measurePlace(id));
          if (v === 'flow') onChange(undefined);
        }}
      />
      {place ? (
        <>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Перетаскивайте элемент на холсте в любое место — он примагничивается к краям и центрам соседей.
            Alt — без примагничивания, Shift — только по горизонтали или вертикали, стрелки — сдвиг на 1px
            (с Shift — на 10px).
          </p>
          <div className="flex flex-wrap gap-3">
            <NumberBox label="X" suffix="%" value={place.x} onChange={(x) => onChange({ ...place, x })} />
            <NumberBox label="Y" suffix="px" value={place.y} onChange={(y) => onChange({ ...place, y })} />
          </div>
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-zinc-600">На телефоне</span>
            <Segmented
              options={[
                { value: 'flow', label: 'По порядку, как обычно', title: 'Экран узкий — элемент встаёт в общий столбец' },
                { value: 'keep', label: 'На том же месте' },
              ]}
              value={place.mobile === 'keep' ? 'keep' : 'flow'}
              onChange={(mobile) => onChange({ ...place, mobile: mobile as Place['mobile'] })}
            />
          </div>
        </>
      ) : (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Элемент стоит в общем порядке блока. Выберите «Свободно», чтобы поставить его в любое место.
        </p>
      )}
    </div>
  );
}

function DimBox({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-600">
      {label}
      <input
        type="number"
        min={1}
        value={value ?? ''}
        placeholder="авто"
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) && v > 0 ? Math.round(v) : undefined);
        }}
        className={`${inputCls} w-20 px-1.5 py-1 text-xs`}
      />
      px
    </label>
  );
}

function DimsEditor({ value, onChange }: { value: unknown; onChange: (v: Dims | undefined) => void }) {
  const dims: Dims = isDims(value) ? value : {};
  const set = (next: Dims) => onChange(isDims(next) ? next : undefined);
  return (
    <div className="space-y-2.5 text-zinc-900">
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Тяните за уголок или сторону рамки на холсте. Размер примагничивается к краям и к размерам соседних
        элементов. Shift — сохранить пропорции, Alt — без примагничивания.
      </p>
      <div className="flex flex-wrap gap-3">
        <DimBox label="Ш" value={dims.w} onChange={(w) => set({ ...dims, w })} />
        <DimBox label="В" value={dims.h} onChange={(h) => set({ ...dims, h })} />
      </div>
      {isDims(value) && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
        >
          Сбросить — по содержимому
        </button>
      )}
    </div>
  );
}

export const dimsField: CustomField<Dims | undefined> = {
  type: 'custom',
  label: 'Размер',
  render: ({ value, onChange }) => (
    <FieldLabel label="Размер" el="div">
      <DimsEditor value={value} onChange={onChange} />
    </FieldLabel>
  ),
};

export const placeField: CustomField<Place | undefined> = {
  type: 'custom',
  label: 'Размещение',
  render: ({ value, onChange }) => (
    <FieldLabel label="Размещение" el="div">
      <PlaceEditor value={value} onChange={onChange} />
    </FieldLabel>
  ),
};

/* ---------- Компоненты ---------- */

export const ELEMENT_LABELS: Record<string, string> = {
  elHeading: 'Заголовок',
  elText: 'Текст',
  elButton: 'Кнопка / ссылка',
  elImage: 'Фото',
  elVideo: 'Видео',
  elIcon: 'Иконка',
  elBadge: 'Плашка',
  elList: 'Список',
  elDivider: 'Линия',
  elSection: 'Секция',
  elColumns: 'Колонки',
  elGroup: 'Группа (ряд / стопка)',
  box: 'Контейнер сайта',
  [SITE_FRAGMENT_TYPE]: 'Элемент сайта',
};

const L = ELEMENT_LABELS;

const baseComponents: Record<string, ComponentCfg> = {
  elHeading: {
    label: L.elHeading,
    inline: true,
    fields: {
      text: { type: 'textarea', label: 'Текст заголовка' },
      level: {
        type: 'select',
        label: 'Уровень (для поисковиков)',
        options: [
          { label: 'H1 — главный на странице', value: 1 },
          { label: 'H2 — раздел', value: 2 },
          { label: 'H3 — подраздел', value: 3 },
          { label: 'H4', value: 4 },
        ],
      },
      size: {
        type: 'radio',
        label: 'Размер',
        options: [
          { label: 'XL', value: 'xl' },
          { label: 'L', value: 'l' },
          { label: 'M', value: 'm' },
          { label: 'S', value: 's' },
          { label: 'XS', value: 'xs' },
        ],
      },
      weight: {
        type: 'radio',
        label: 'Насыщенность',
        options: [
          { label: 'Обычный', value: 'normal' },
          { label: 'Средний', value: 'medium' },
          { label: 'Полужирный', value: 'semibold' },
          { label: 'Жирный', value: 'bold' },
        ],
      },
      upper: yesNo('Заглавными буквами'),
      style: styleField(),
    },
    defaultProps: { text: 'Заголовок', level: 2, size: 'l', weight: 'semibold', upper: 'no', style: {} },
    render: atom('elHeading', L.elHeading),
  },

  elText: {
    label: L.elText,
    inline: true,
    fields: {
      text: richText,
      size: {
        type: 'radio',
        label: 'Размер текста',
        options: [
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
          { label: 'L', value: 'l' },
          { label: 'XL', value: 'xl' },
        ],
      },
      style: styleField(),
    },
    defaultProps: { text: '<p>Текст абзаца. Нажмите на блок, чтобы изменить его справа.</p>', size: 'm', style: {} },
    render: atom('elText', L.elText),
  },

  elButton: {
    label: L.elButton,
    inline: true,
    fields: {
      label: { type: 'text', label: 'Текст кнопки' },
      href: linkField('Куда ведёт (страница, сайт или PDF)'),
      variant: { type: 'select', label: 'Вид', options: buttonVariantOptions },
      tone: colorField('Цвет'),
      shape: buttonShapeField,
      size: buttonSizeField,
      icon: buttonIconField,
      iconPosition: iconPositionField,
      upper: yesNo('Заглавными буквами'),
      style: styleField('placement'),
    },
    resolveFields: (data, { fields }) => {
      const next = { ...fields } as Record<string, Field>;
      const variant = data.props.variant;
      if (variant === 'icon') {
        delete next.iconPosition;
        delete next.upper;
      }
      if (variant === 'link' || variant === 'arrow') delete next.shape;
      return next as typeof fields;
    },
    defaultProps: {
      label: 'Подробнее',
      href: '/zakaz',
      variant: 'filled',
      tone: 'primary',
      shape: 'pill',
      size: 'm',
      icon: 'auto',
      iconPosition: 'right',
      upper: 'yes',
      style: {},
    },
    render: atom('elButton', L.elButton),
  },

  elImage: {
    label: L.elImage,
    inline: true,
    fields: {
      src: mediaField('Фото', 'IMAGE'),
      alt: { type: 'text', label: 'Описание фото (для поисковиков)' },
      caption: { type: 'text', label: 'Подпись под фото' },
      href: linkField('Ссылка по клику (необязательно)'),
      size: mediaSizeField,
      ratio: ratioField,
      fit: {
        type: 'radio',
        label: 'Как вписать',
        options: [
          { label: 'Заполнить (обрезать края)', value: 'cover' },
          { label: 'Целиком', value: 'contain' },
        ],
      },
      rounded: roundedField,
      style: styleField(),
    },
    defaultProps: { src: '', alt: '', caption: '', href: '', size: 'full', ratio: 'auto', fit: 'cover', rounded: 'm', style: {} },
    render: atom('elImage', L.elImage),
  },

  elVideo: {
    label: L.elVideo,
    inline: true,
    fields: {
      src: videoSrcField,
      poster: mediaField('Обложка (до запуска)', 'IMAGE'),
      caption: { type: 'text', label: 'Подпись' },
      autoplay: {
        type: 'radio',
        label: 'Воспроизведение',
        options: [
          { label: 'По кнопке', value: 'no' },
          { label: 'Само, без звука, по кругу', value: 'yes' },
        ],
      },
      size: mediaSizeField,
      ratio: ratioField,
      rounded: roundedField,
      style: styleField(),
    },
    defaultProps: { src: '', poster: '', caption: '', autoplay: 'no', size: 'full', ratio: '16-9', rounded: 'm', style: {} },
    render: atom('elVideo', L.elVideo),
  },

  elIcon: {
    label: L.elIcon,
    inline: true,
    fields: {
      icon: iconField('Иконка'),
      size: {
        type: 'radio',
        label: 'Размер',
        options: [
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
          { label: 'L', value: 'l' },
          { label: 'XL', value: 'xl' },
        ],
      },
      tone: colorField('Цвет'),
      background: {
        type: 'radio',
        label: 'Фон иконки',
        options: [
          { label: 'Нет', value: 'none' },
          { label: 'Мягкий круг', value: 'soft' },
          { label: 'Залитый круг', value: 'filled' },
          { label: 'Контур', value: 'outline' },
        ],
      },
      fill: yesNo('Залитая иконка'),
      recolor: {
        type: 'radio',
        label: 'Цвет своей иконки',
        options: [
          { label: 'Перекрасить в выбранный', value: 'yes' },
          { label: 'Оригинальные цвета', value: 'no' },
        ],
      },
      style: styleField('placement'),
    },
    resolveFields: (data, { fields }) => {
      const next = { ...fields } as Record<string, Field>;
      if (isIconUrl(data.props.icon as string)) delete next.fill;
      else delete next.recolor;
      return next as typeof fields;
    },
    defaultProps: {
      icon: 'precision_manufacturing',
      size: 'm',
      tone: 'primary',
      background: 'none',
      fill: 'no',
      recolor: 'yes',
      style: {},
    },
    render: atom('elIcon', L.elIcon),
  },

  elBadge: {
    label: L.elBadge,
    inline: true,
    fields: {
      text: { type: 'text', label: 'Текст' },
      tone: colorField('Цвет'),
      variant: {
        type: 'radio',
        label: 'Вид',
        options: [
          { label: 'Мягкая', value: 'soft' },
          { label: 'Контур', value: 'outline' },
          { label: 'Залитая', value: 'filled' },
        ],
      },
      dot: yesNo('Мигающая точка'),
      style: styleField('placement'),
    },
    defaultProps: { text: 'Новинка', tone: 'primary', variant: 'soft', dot: 'yes', style: {} },
    render: atom('elBadge', L.elBadge),
  },

  elList: {
    label: L.elList,
    inline: true,
    fields: {
      items: {
        type: 'array',
        label: 'Пункты',
        arrayFields: { text: { type: 'textarea', label: 'Текст пункта' } },
        defaultItemProps: { text: 'Пункт списка' },
        getItemSummary: (item: { text?: string }) => item.text?.slice(0, 40) || 'Пункт',
      },
      marker: {
        type: 'select',
        label: 'Маркер',
        options: [
          { label: 'Галочка', value: 'check' },
          { label: 'Стрелка', value: 'arrow' },
          { label: 'Точка', value: 'dot' },
          { label: 'Тире', value: 'dash' },
          { label: 'Номер', value: 'number' },
          { label: 'Без маркера', value: 'none' },
        ],
      },
      tone: colorField('Цвет маркера'),
      size: {
        type: 'radio',
        label: 'Размер текста',
        options: [
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
          { label: 'L', value: 'l' },
        ],
      },
      gap: {
        type: 'radio',
        label: 'Расстояние между пунктами',
        options: [
          { label: 'Малое', value: 's' },
          { label: 'Среднее', value: 'm' },
          { label: 'Большое', value: 'l' },
        ],
      },
      style: styleField(),
    },
    defaultProps: {
      items: [{ text: 'Первый пункт' }, { text: 'Второй пункт' }, { text: 'Третий пункт' }],
      marker: 'check',
      tone: 'primary',
      size: 'm',
      gap: 'm',
      style: {},
    },
    render: atom('elList', L.elList),
  },

  elDivider: {
    label: L.elDivider,
    inline: true,
    fields: {
      thickness: {
        type: 'radio',
        label: 'Толщина',
        options: [
          { label: 'Тонкая', value: 'thin' },
          { label: 'Средняя', value: 'medium' },
          { label: 'Толстая', value: 'thick' },
        ],
      },
      length: {
        type: 'radio',
        label: 'Длина',
        options: [
          { label: 'Во всю ширину', value: 'full' },
          { label: 'Половина', value: 'half' },
          { label: 'Короткая', value: 'short' },
        ],
      },
      lineStyle: {
        type: 'radio',
        label: 'Линия',
        options: [
          { label: 'Сплошная', value: 'solid' },
          { label: 'Пунктир', value: 'dashed' },
        ],
      },
      tone: colorField('Цвет', { none: 'Серая (по умолчанию)' }),
      style: styleField('placement'),
    },
    defaultProps: { thickness: 'thin', length: 'full', lineStyle: 'solid', tone: '', style: {} },
    render: atom('elDivider', L.elDivider),
  },

  elSection: {
    label: L.elSection,
    inline: true,
    fields: {
      width: {
        type: 'radio',
        label: 'Ширина секции',
        options: [
          { label: 'Узкая', value: 'narrow' },
          { label: 'Обычная', value: 'normal' },
          { label: 'Во весь экран', value: 'wide' },
        ],
      },
      ...layoutFields,
      style: styleField(),
      content: slot(),
    },
    resolveFields: (data, { fields }) =>
      resolveLayoutFields(data.props.direction, fields as Record<string, Field>) as typeof fields,
    defaultProps: {
      width: 'normal',
      direction: 'col',
      gap: 'm',
      justify: 'start',
      alignItems: 'stretch',
      wrap: 'yes',
      mobileStack: 'yes',
      style: { bg: 'glass', pad: 'l' },
      content: [
        { type: 'elHeading', props: { text: 'Заголовок секции', level: 2, size: 'l', weight: 'semibold', upper: 'no', style: {} } },
        {
          type: 'elText',
          props: { text: '<p>Перетащите сюда элементы из списка слева: текст, фото, кнопки, колонки…</p>', size: 'm', style: {} },
        },
      ],
    },
    render: SectionRender,
  },

  elColumns: {
    label: L.elColumns,
    inline: true,
    fields: {
      count: {
        type: 'radio',
        label: 'Количество колонок',
        options: [
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4', value: 4 },
        ],
      },
      ratio: { type: 'select', label: 'Ширина колонок', options: COLUMN_RATIO_OPTIONS[2] },
      gap: gapField,
      valign: {
        type: 'radio',
        label: 'По вертикали',
        options: [
          { label: 'Сверху', value: 'start' },
          { label: 'По центру', value: 'center' },
          { label: 'Снизу', value: 'end' },
          { label: 'Одной высоты', value: 'stretch' },
        ],
      },
      mobile: {
        type: 'radio',
        label: 'На телефоне',
        options: [
          { label: 'Друг под другом', value: 'stack' },
          { label: 'Друг под другом, снизу вверх', value: 'reverse' },
          { label: 'Оставить рядом', value: 'keep' },
        ],
      },
      style: styleField(),
      col1: slot(),
      col2: slot(),
      col3: slot(),
      col4: slot(),
    },
    resolveFields: (data, { fields }) => {
      const count = Number(data.props.count) || 2;
      return {
        ...fields,
        ratio: { type: 'select', label: 'Ширина колонок', options: COLUMN_RATIO_OPTIONS[count] ?? COLUMN_RATIO_OPTIONS[4] },
      } as typeof fields;
    },
    defaultProps: {
      count: 2,
      ratio: 'equal',
      gap: 'l',
      valign: 'center',
      mobile: 'stack',
      style: {},
      col1: [
        { type: 'elHeading', props: { text: 'Заголовок', level: 2, size: 'l', weight: 'semibold', upper: 'no', style: {} } },
        { type: 'elText', props: { text: '<p>Текст левой колонки.</p>', size: 'm', style: {} } },
      ],
      col2: [
        { type: 'elImage', props: { src: '', alt: '', caption: '', href: '', size: 'full', ratio: '4-3', fit: 'cover', rounded: 'm', style: {} } },
      ],
      col3: [],
      col4: [],
    },
    render: ColumnsRender,
  },

  elGroup: {
    label: L.elGroup,
    inline: true,
    fields: {
      ...layoutFields,
      style: styleField(),
      content: slot(),
    },
    resolveFields: (data, { fields }) =>
      resolveLayoutFields(data.props.direction, fields as Record<string, Field>) as typeof fields,
    defaultProps: {
      direction: 'row',
      gap: 's',
      justify: 'start',
      alignItems: 'center',
      wrap: 'yes',
      mobileStack: 'no',
      style: {},
      content: [
        {
          type: 'elButton',
          props: {
            label: 'Оставить заявку',
            href: '/zakaz',
            variant: 'filled',
            tone: 'primary',
            shape: 'pill',
            size: 'm',
            icon: 'auto',
            iconPosition: 'right',
            upper: 'yes',
            style: {},
          },
        },
        {
          type: 'elButton',
          props: {
            label: 'Презентация',
            href: '',
            variant: 'outline',
            tone: 'primary',
            shape: 'pill',
            size: 'm',
            icon: 'auto',
            iconPosition: 'left',
            upper: 'yes',
            style: {},
          },
        },
      ],
    },
    render: GroupRender,
  },

  box: {
    label: L.box,
    inline: true,
    fields: {
      label: { type: 'text', label: 'Название (видно только в админке)' },
      open: boxTagField,
      content: slot(),
    },
    render: BoxRender,
  },

  [SITE_FRAGMENT_TYPE]: {
    label: L[SITE_FRAGMENT_TYPE],
    inline: true,
    fields: {
      label: { type: 'text', label: 'Название (видно только в админке)' },
      content: siteSectionField,
    },
    render: FragmentRender,
  },
};

/** Всем элементам — поля «Размещение» и «Размер» (после «Оформления») */
export const elementComponents: Record<string, ComponentCfg> = Object.fromEntries(
  Object.entries(baseComponents).map(([type, cfg]) => [
    type,
    { ...cfg, fields: { ...cfg.fields, place: placeField, dims: dimsField } },
  ]),
);
