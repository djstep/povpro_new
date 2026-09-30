'use client';

import type { Config, Field, Fields, RichtextField } from '@puckeditor/core';
import {
  DEFAULT_MAIN_CLASS,
  renderBlockHtml,
  type ButtonItem,
  type ContentBlock,
} from '@/lib/cms/content-blocks';
import { SITE_FRAGMENT_TYPE, SITE_SECTION_TYPE, mainClassFromAttrs, type ShellProps } from '@/lib/cms/builder-data';
import { iconField, linkField, mediaField } from '@/components/admin/builder/fields';
import { siteSectionField } from '@/components/admin/builder/SiteSectionField';
import { useMedia } from '@/components/admin/builder/media';
import { colorField } from '@/components/admin/builder/StyleField';
import {
  ELEMENT_LABELS,
  buttonIconField,
  buttonShapeField,
  buttonSizeField,
  buttonVariantOptions,
  elementComponents,
  iconPositionField,
} from '@/components/admin/builder/elements-config';

/* ---------- Превью блока на холсте: тот же HTML, что и на сайте ---------- */

function BlockPreview({ type, props, label }: { type: string; props: Record<string, unknown>; label: string }) {
  const media = useMedia();
  const rest = { ...props };
  delete rest.puck;
  delete rest.editMode;
  const block = (
    type === SITE_SECTION_TYPE ? { ...rest, type: 'html', raw: true } : { ...rest, type }
  ) as ContentBlock;
  const html = media.previewHtml(renderBlockHtml(block));
  if (!html.trim()) {
    return (
      <div className="cms-section">
        <div className="cms-builder-empty">«{label}» — заполните блок в панели справа</div>
      </div>
    );
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function preview(type: string, label: string) {
  function Render(props: Record<string, unknown>) {
    return <BlockPreview type={type} props={props} label={label} />;
  }
  Render.displayName = `Preview_${type}`;
  return Render;
}

/* ---------- Общие поля ---------- */

const alignOptions = [
  { label: 'Слева', value: 'left' },
  { label: 'По центру', value: 'center' },
];

const spacingOptions = [
  { label: 'Нет', value: 'none' },
  { label: 'Малый', value: 's' },
  { label: 'Средний', value: 'm' },
  { label: 'Большой', value: 'l' },
];

const columnsField: Field = {
  type: 'radio',
  label: 'Колонок',
  options: [
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
  ],
};

const ratioField: Field = {
  type: 'select',
  label: 'Пропорции фото',
  options: [
    { label: 'Как есть', value: 'auto' },
    { label: 'Горизонтальное 16:10', value: 'landscape' },
    { label: 'Квадрат', value: 'square' },
    { label: 'Вертикальное 3:4', value: 'portrait' },
  ],
};

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

const buttonsField: Field = {
  type: 'array',
  label: 'Кнопки',
  arrayFields: {
    label: { type: 'text', label: 'Текст кнопки' },
    href: linkField('Ссылка или PDF'),
  },
  defaultItemProps: { label: 'Презентация', href: '' },
  getItemSummary: (item: ButtonItem) => item.label || 'Кнопка',
};

function styleFields(opts: { background?: boolean } = {}): Fields {
  const fields: Fields = {};
  if (opts.background !== false) {
    fields.background = {
      type: 'radio',
      label: 'Подложка',
      options: [
        { label: 'Стекло', value: 'glass' },
        { label: 'Акцент', value: 'accent' },
        { label: 'Нет', value: 'none' },
      ],
    };
  }
  fields.width = {
    type: 'radio',
    label: 'Ширина',
    options: [
      { label: 'Узкая', value: 'narrow' },
      { label: 'Обычная', value: 'normal' },
      { label: 'Широкая', value: 'wide' },
    ],
  };
  fields.spaceTop = { type: 'select', label: 'Отступ сверху', options: spacingOptions };
  fields.spaceBottom = { type: 'select', label: 'Отступ снизу', options: spacingOptions };
  return fields;
}

const styleDefaults = { width: 'normal', spaceTop: 'none', spaceBottom: 'm' };

/* ---------- Компоненты ---------- */

export const BLOCK_LABELS: Record<string, string> = {
  hero: 'Обложка',
  title: 'Заголовок',
  textMedia: 'Текст + фото',
  cards: 'Карточки',
  buttons: 'Кнопки / презентации',
  cta: 'Призыв оставить заявку',
  gallery: 'Галерея',
  videoSection: 'Видео',
  stats: 'Цифры',
  spacer: 'Отступ',
  html: 'HTML-код',
  [SITE_SECTION_TYPE]: 'Секция сайта',
  heading: 'Заголовок (старый)',
  text: 'Текст (старый)',
  image: 'Фото (старое)',
  video: 'Видео (старое)',
  ...ELEMENT_LABELS,
};

function label(type: string) {
  return BLOCK_LABELS[type] ?? type;
}

export const builderConfig: Config = {
  categories: {
    elements: {
      title: 'Элементы',
      components: ['elHeading', 'elText', 'elButton', 'elImage', 'elVideo', 'elIcon', 'elBadge', 'elList', 'elDivider', 'spacer'],
    },
    layout: { title: 'Раскладка', components: ['elSection', 'elColumns', 'elGroup'] },
    main: {
      title: 'Готовые блоки',
      components: ['hero', 'title', 'textMedia', 'cards', 'buttons', 'cta'],
      defaultExpanded: false,
    },
    media: { title: 'Готовые: фото и видео', components: ['gallery', 'videoSection'], defaultExpanded: false },
    extra: { title: 'Дополнительно', components: ['stats', 'html'], defaultExpanded: false },
    site: { title: 'Секции сайта', components: [SITE_SECTION_TYPE, SITE_FRAGMENT_TYPE, 'box'], visible: false },
    other: { visible: false },
  },
  root: {
    fields: {},
    render: ({ children, shell }: { children: React.ReactNode; shell?: ShellProps | null }) => (
      <div className="site-content font-body-md text-body-md w-full cms-builder-canvas">
        <main className={mainClassFromAttrs(shell?.mainAttrs) ?? DEFAULT_MAIN_CLASS}>{children}</main>
      </div>
    ),
  },
  components: {
    hero: {
      label: label('hero'),
      fields: {
        badge: { type: 'text', label: 'Плашка над заголовком' },
        title: { type: 'textarea', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Описание' },
        image: mediaField('Фото', 'IMAGE'),
        imagePosition: {
          type: 'radio',
          label: 'Фото',
          options: [
            { label: 'Справа', value: 'right' },
            { label: 'Слева', value: 'left' },
          ],
        },
        buttons: buttonsField,
      },
      defaultProps: {
        badge: '',
        title: 'Заголовок страницы',
        subtitle: 'Коротко: чем вы занимаетесь и чем это полезно клиенту.',
        image: '',
        imagePosition: 'right',
        buttons: [{ label: 'Оставить заявку', href: '/zakaz' }],
      },
      render: preview('hero', label('hero')),
    },

    title: {
      label: label('title'),
      fields: {
        eyebrow: { type: 'text', label: 'Плашка над заголовком' },
        text: { type: 'textarea', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Подзаголовок' },
        size: {
          type: 'radio',
          label: 'Размер',
          options: [
            { label: 'Крупный (страница)', value: 'page' },
            { label: 'Раздел', value: 'section' },
          ],
        },
        align: { type: 'radio', label: 'Выравнивание', options: alignOptions },
        ...styleFields(),
      },
      defaultProps: {
        eyebrow: '',
        text: 'Заголовок раздела',
        subtitle: '',
        size: 'section',
        align: 'center',
        background: 'none',
        ...styleDefaults,
      },
      render: preview('title', label('title')),
    },

    textMedia: {
      label: label('textMedia'),
      fields: {
        eyebrow: { type: 'text', label: 'Плашка над заголовком' },
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'text', label: 'Подзаголовок' },
        text: richText,
        buttons: buttonsField,
        mediaType: {
          type: 'radio',
          label: 'Медиа',
          options: [
            { label: 'Фото', value: 'image' },
            { label: 'Видео', value: 'video' },
            { label: 'Нет', value: 'none' },
          ],
        },
        image: mediaField('Фото', 'IMAGE'),
        video: mediaField('Видео', 'VIDEO'),
        alt: { type: 'text', label: 'Описание фото (для поисковиков)' },
        caption: { type: 'text', label: 'Подпись под фото' },
        mediaPosition: {
          type: 'radio',
          label: 'Где фото',
          options: [
            { label: 'Справа', value: 'right' },
            { label: 'Слева', value: 'left' },
            { label: 'Сверху', value: 'top' },
            { label: 'Снизу', value: 'bottom' },
          ],
        },
        mediaSize: {
          type: 'radio',
          label: 'Ширина фото',
          options: [
            { label: '1/3', value: 'third' },
            { label: '1/2', value: 'half' },
            { label: '2/3', value: 'twoThirds' },
          ],
        },
        mediaRatio: ratioField,
        verticalAlign: {
          type: 'radio',
          label: 'Текст по вертикали',
          options: [
            { label: 'По центру', value: 'center' },
            { label: 'По верху', value: 'start' },
          ],
        },
        textAlign: { type: 'radio', label: 'Выравнивание текста', options: alignOptions },
        ...styleFields(),
      },
      resolveFields: (data, { fields }) => {
        const next = { ...fields } as Record<string, Field>;
        const mediaType = (data.props.mediaType as string | undefined) ?? 'image';
        if (mediaType !== 'image') {
          delete next.image;
          delete next.alt;
        }
        if (mediaType !== 'video') delete next.video;
        if (mediaType === 'none') {
          delete next.caption;
          delete next.mediaPosition;
          delete next.mediaSize;
          delete next.mediaRatio;
          delete next.verticalAlign;
        } else {
          const position = (data.props.mediaPosition as string | undefined) ?? 'right';
          if (position === 'top' || position === 'bottom') {
            delete next.mediaSize;
            delete next.verticalAlign;
          }
        }
        return next as typeof fields;
      },
      defaultProps: {
        eyebrow: '',
        title: 'Заголовок блока',
        subtitle: '',
        text: '<p>Расскажите подробнее: что делаете, для кого, какие преимущества.</p>',
        buttons: [],
        mediaType: 'image',
        image: '',
        video: '',
        alt: '',
        caption: '',
        mediaPosition: 'right',
        mediaSize: 'half',
        mediaRatio: 'auto',
        verticalAlign: 'center',
        textAlign: 'left',
        background: 'glass',
        ...styleDefaults,
      },
      render: preview('textMedia', label('textMedia')),
    },

    cards: {
      label: label('cards'),
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Подзаголовок' },
        items: {
          type: 'array',
          label: 'Карточки',
          arrayFields: {
            icon: iconField('Иконка'),
            image: mediaField('Фото (необязательно)', 'IMAGE'),
            title: { type: 'text', label: 'Заголовок' },
            text: { type: 'textarea', label: 'Текст' },
            href: linkField('Ссылка (необязательно)'),
          },
          defaultItemProps: { icon: 'settings', image: '', title: 'Преимущество', text: 'Короткое описание.', href: '' },
          getItemSummary: (item: { title?: string }) => item.title || 'Карточка',
        },
        columns: columnsField,
        cardStyle: {
          type: 'radio',
          label: 'Вид карточек',
          options: [
            { label: 'Стекло', value: 'glass' },
            { label: 'Рамка', value: 'outline' },
            { label: 'Без фона', value: 'plain' },
          ],
        },
        textAlign: { type: 'radio', label: 'Выравнивание текста', options: alignOptions },
        ...styleFields(),
      },
      defaultProps: {
        title: 'Наши преимущества',
        subtitle: '',
        items: [
          { icon: 'precision_manufacturing', image: '', title: 'Современное оборудование', text: 'Короткое описание.', href: '' },
          { icon: 'verified', image: '', title: 'Контроль качества', text: 'Короткое описание.', href: '' },
          { icon: 'schedule', image: '', title: 'Точно в срок', text: 'Короткое описание.', href: '' },
        ],
        columns: 3,
        cardStyle: 'glass',
        textAlign: 'left',
        background: 'none',
        ...styleDefaults,
      },
      render: preview('cards', label('cards')),
    },

    buttons: {
      label: label('buttons'),
      fields: {
        items: { ...buttonsField, label: 'Кнопки' } as Field,
        variant: {
          type: 'select',
          label: 'Вид кнопок',
          options: [{ label: 'Классический (как раньше)', value: '' }, ...buttonVariantOptions],
        },
        tone: colorField('Цвет'),
        shape: buttonShapeField,
        size: buttonSizeField,
        icon: buttonIconField,
        iconPosition: iconPositionField,
        upper: {
          type: 'radio',
          label: 'Заглавными буквами',
          options: [
            { label: 'Да', value: 'yes' },
            { label: 'Нет', value: 'no' },
          ],
        },
        align: {
          type: 'radio',
          label: 'Выравнивание',
          options: [
            ...alignOptions,
            { label: 'Справа', value: 'right' },
            { label: 'На всю ширину', value: 'stretch' },
          ],
        },
        ...styleFields({ background: false }),
      },
      resolveFields: (data, { fields }) => {
        const next = { ...fields } as Record<string, Field>;
        const variant = data.props.variant as string | undefined;
        if (!variant) {
          for (const key of ['tone', 'shape', 'size', 'icon', 'iconPosition', 'upper']) delete next[key];
          next.align = { type: 'radio', label: 'Выравнивание', options: alignOptions };
        } else {
          if (variant === 'icon') {
            delete next.iconPosition;
            delete next.upper;
          }
          if (variant === 'link' || variant === 'arrow') delete next.shape;
        }
        return next as typeof fields;
      },
      defaultProps: {
        items: [{ label: 'Презентация компании', href: '' }],
        variant: 'glass',
        tone: 'primary',
        shape: 'pill',
        size: 'm',
        icon: 'auto',
        iconPosition: 'left',
        upper: 'yes',
        align: 'center',
        ...styleDefaults,
      },
      render: preview('buttons', label('buttons')),
    },

    cta: {
      label: label('cta'),
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        text: { type: 'textarea', label: 'Текст' },
        buttonLabel: { type: 'text', label: 'Текст кнопки' },
        href: linkField('Куда ведёт кнопка'),
        secondaryLabel: { type: 'text', label: 'Вторая кнопка (необязательно)' },
        secondaryHref: linkField('Ссылка второй кнопки'),
        ...styleFields(),
      },
      defaultProps: {
        title: 'Готовы обсудить ваш заказ?',
        text: 'Оставьте заявку — инженер свяжется с вами и рассчитает стоимость.',
        buttonLabel: 'Оставить заявку',
        href: '/zakaz',
        secondaryLabel: '',
        secondaryHref: '',
        background: 'accent',
        ...styleDefaults,
      },
      render: preview('cta', label('cta')),
    },

    gallery: {
      label: label('gallery'),
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        items: {
          type: 'array',
          label: 'Фото',
          arrayFields: {
            src: mediaField('Фото', 'IMAGE'),
            caption: { type: 'text', label: 'Подпись' },
          },
          defaultItemProps: { src: '', caption: '' },
          getItemSummary: (item: { caption?: string; src?: string }, index?: number) =>
            item.caption || (item.src ? item.src.split('/').pop() : `Фото ${(index ?? 0) + 1}`),
        },
        columns: columnsField,
        ratio: ratioField,
        ...styleFields(),
      },
      defaultProps: {
        title: '',
        items: [
          { src: '', caption: '' },
          { src: '', caption: '' },
          { src: '', caption: '' },
        ],
        columns: 3,
        ratio: 'landscape',
        background: 'none',
        ...styleDefaults,
      },
      render: preview('gallery', label('gallery')),
    },

    videoSection: {
      label: label('videoSection'),
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        src: mediaField('Видео', 'VIDEO'),
        poster: mediaField('Обложка видео', 'IMAGE'),
        caption: { type: 'text', label: 'Подпись' },
        ...styleFields(),
      },
      defaultProps: { title: '', src: '', poster: '', caption: '', background: 'glass', ...styleDefaults },
      render: preview('videoSection', label('videoSection')),
    },

    stats: {
      label: label('stats'),
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        items: {
          type: 'array',
          label: 'Показатели',
          arrayFields: {
            value: { type: 'text', label: 'Число' },
            label: { type: 'text', label: 'Подпись' },
          },
          defaultItemProps: { value: '100+', label: 'подпись' },
          getItemSummary: (item: { value?: string; label?: string }) =>
            [item.value, item.label].filter(Boolean).join(' — ') || 'Показатель',
        },
        columns: columnsField,
        ...styleFields(),
      },
      defaultProps: {
        title: '',
        items: [
          { value: '30+', label: 'лет опыта' },
          { value: '500+', label: 'выполненных заказов' },
          { value: '100%', label: 'контроль качества' },
          { value: '24 ч', label: 'на расчёт стоимости' },
        ],
        columns: 4,
        background: 'glass',
        ...styleDefaults,
      },
      render: preview('stats', label('stats')),
    },

    spacer: {
      label: label('spacer'),
      fields: {
        size: {
          type: 'radio',
          label: 'Высота',
          options: [
            { label: 'S', value: 's' },
            { label: 'M', value: 'm' },
            { label: 'L', value: 'l' },
            { label: 'XL', value: 'xl' },
          ],
        },
      },
      defaultProps: { size: 'm' },
      render: preview('spacer', label('spacer')),
    },

    html: {
      label: label('html'),
      fields: {
        label: { type: 'text', label: 'Название (видно только в админке)' },
        content: { type: 'textarea', label: 'HTML-код' },
      },
      defaultProps: { label: '', content: '<div class="cms-card"><p>HTML-код</p></div>' },
      render: preview('html', label('html')),
    },

    [SITE_SECTION_TYPE]: {
      label: label(SITE_SECTION_TYPE),
      fields: {
        label: { type: 'text', label: 'Название (видно только в админке)' },
        content: siteSectionField,
      },
      render: preview(SITE_SECTION_TYPE, label(SITE_SECTION_TYPE)),
    },

    heading: { label: label('heading'), render: preview('heading', label('heading')) },
    text: { label: label('text'), render: preview('text', label('text')) },
    image: { label: label('image'), render: preview('image', label('image')) },
    video: { label: label('video'), render: preview('video', label('video')) },

    ...elementComponents,
  },
};
