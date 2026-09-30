'use client';

import '@puckeditor/core/puck.css';
import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  ActionBar,
  Puck,
  createUsePuck,
  useGetPuck,
  type Data,
  type Dictionary,
  type FieldTransforms,
  type Viewports,
} from '@puckeditor/core';
import { builderConfig } from '@/components/admin/builder/config';
import { FREE_TYPES, measurePlace, updatePlace, useFreeDrag } from '@/components/admin/builder/FreeDrag';
import { MediaLibraryProvider } from '@/components/admin/builder/media';
import { useResizeHandles } from '@/components/admin/builder/ResizeHandles';
import type { BuilderData } from '@/lib/cms/builder-data';
import { isPlace } from '@/lib/cms/elements';

const DICTIONARY: Dictionary = {
  'header-publish': 'Сохранить',
  'header-undo': 'Отменить',
  'header-redo': 'Повторить',
  'header-toggle-leftsidebar': 'Показать/скрыть блоки',
  'header-toggle-rightsidebar': 'Показать/скрыть настройки',
  'header-toggle-menubar': 'Меню',
  'action-selectparent': 'Выбрать родителя',
  'action-duplicate': 'Дублировать',
  'action-delete': 'Удалить',
  'label-page': 'Страница',
  'label-component': 'Блок',
  'outline-empty': 'Блоков пока нет',
  'outline-item-collapse': 'Свернуть',
  'outline-item-expand': 'Развернуть',
  'outline-header-title': 'Структура',
  'outline-header-collapseall': 'Свернуть всё',
  'outline-item-duplicate': 'Дублировать',
  'outline-item-delete': 'Удалить',
  'drawer-category-collapse': 'Свернуть «{title}»',
  'drawer-category-expand': 'Развернуть «{title}»',
  'drawer-category-other': 'Другое',
  'canvas-noconfig': 'Нет настроек для блока {type}',
  'field-readonly': 'Только чтение',
  'field-arrayitem-summary': 'Элемент {index}',
  'field-arrayitem-duplicate': 'Дублировать',
  'field-arrayitem-delete': 'Удалить',
  'field-external-selectdata': 'Выбрать',
  'field-external-search': 'Поиск',
  'field-external-togglefilters': 'Фильтры',
  'field-external-item': 'Элемент',
  'field-external-result-singular': '{count} результат',
  'field-external-result-plural': '{count} результатов',
  'field-richtext-bold': 'Жирный',
  'field-richtext-italic': 'Курсив',
  'field-richtext-underline': 'Подчёркнутый',
  'field-richtext-strikethrough': 'Зачёркнутый',
  'field-richtext-blockquote': 'Цитата',
  'field-richtext-code-inline': 'Код',
  'field-richtext-code-block': 'Блок кода',
  'field-richtext-list-bullet': 'Маркированный список',
  'field-richtext-list-ordered': 'Нумерованный список',
  'field-richtext-horizontalrule': 'Разделитель',
  'field-richtext-align-left': 'По левому краю',
  'field-richtext-align-center': 'По центру',
  'field-richtext-align-right': 'По правому краю',
  'field-richtext-align-justify': 'По ширине',
  'field-richtext-select': 'Стиль',
  'field-richtext-headingselect-1': 'Заголовок 1',
  'field-richtext-headingselect-2': 'Заголовок',
  'field-richtext-headingselect-3': 'Подзаголовок',
  'field-richtext-headingselect-4': 'Заголовок 4',
  'field-richtext-headingselect-5': 'Заголовок 5',
  'field-richtext-headingselect-6': 'Заголовок 6',
  'field-richtext-alignselect-left': 'Слева',
  'field-richtext-alignselect-center': 'По центру',
  'field-richtext-alignselect-right': 'Справа',
  'field-richtext-alignselect-justify': 'По ширине',
  'field-richtext-listselect-bullet': 'Маркированный список',
  'field-richtext-listselect-ordered': 'Нумерованный список',
  'viewport-zoom-in': 'Увеличить',
  'viewport-zoom-out': 'Уменьшить',
  'viewport-zoom-auto': '{zoom}% (авто)',
  'viewport-toggle-menu': 'Размер экрана',
  'viewport-switch': 'Показать как: {label}',
  'viewport-switch-default': 'Сменить размер экрана',
  'plugin-blocks': 'Блоки',
  'plugin-outline': 'Структура',
  'plugin-fields': 'Настройки',
  'plugin-components': 'Блоки',
  'layout-maximize': 'Развернуть',
  'layout-minimize': 'Свернуть',
  'loader-loading': 'загрузка',
};

const VIEWPORTS: Viewports = [
  { width: 1280, height: 'auto', label: 'Компьютер', icon: 'Monitor' },
  { width: 768, height: 'auto', label: 'Планшет', icon: 'Tablet' },
  { width: 390, height: 'auto', label: 'Телефон', icon: 'Smartphone' },
];

/** В визуальном редакторе текст хранится как HTML-строка — не превращаем его в React-элементы */
const FIELD_TRANSFORMS = {
  richtext: ({ value }) => value,
} satisfies FieldTransforms as FieldTransforms<typeof builderConfig>;

type SaveState = { dirty: boolean; saving: boolean; onSave: (data: Data) => void; publicUrl: string };

const SaveContext = createContext<SaveState | null>(null);

function HeaderActions() {
  const state = useContext(SaveContext);
  const getPuck = useGetPuck();
  if (!state) return <></>;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs ${state.dirty ? 'text-amber-600' : 'text-emerald-600'}`}>
        {state.saving ? 'Сохранение…' : state.dirty ? 'Есть несохранённые правки' : 'Сохранено'}
      </span>
      <a
        href={state.publicUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2"
      >
        Открыть на сайте
      </a>
      <button
        type="button"
        disabled={state.saving || !state.dirty}
        onClick={() => state.onSave(getPuck().appState.data)}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Сохранить
      </button>
    </div>
  );
}

const usePuckSelector = createUsePuck();

/** Над выбранным блоком — его название (для секций сайта их тип у всех одинаковый) */
function NamedActionBar({
  label,
  children,
  parentAction,
}: {
  label?: string;
  children: React.ReactNode;
  parentAction: React.ReactNode;
}) {
  const name = usePuckSelector((s) => {
    const value = s.selectedItem?.props?.label ?? s.selectedItem?.props?.title ?? s.selectedItem?.props?.text;
    return typeof value === 'string' ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  });
  const shown = name ? `${label ?? 'Блок'}: ${name.length > 40 ? `${name.slice(0, 39)}…` : name}` : label;
  return (
    <ActionBar>
      <ActionBar.Group>
        {parentAction}
        {shown && <ActionBar.Label label={shown} />}
      </ActionBar.Group>
      <ActionBar.Group>
        <FreeToggle />
        {children}
      </ActionBar.Group>
    </ActionBar>
  );
}

/** Кнопка «свободно / по порядку» для выбранного элемента */
function FreeToggle() {
  const getPuck = useGetPuck();
  const type = usePuckSelector((s) => s.selectedItem?.type ?? '');
  const id = usePuckSelector((s) => String(s.selectedItem?.props?.id ?? ''));
  const free = usePuckSelector((s) => isPlace(s.selectedItem?.props?.place));
  if (!id || !FREE_TYPES.has(type)) return null;
  return (
    <ActionBar.Action
      label={free ? 'Вернуть в общий порядок' : 'Свободно: двигать мышью в любое место'}
      active={free}
      onClick={(e) => {
        e.stopPropagation();
        updatePlace(getPuck, id, free ? undefined : measurePlace(id));
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" />
      </svg>
    </ActionBar.Action>
  );
}

/** Документ холста получает те же классы html/body, что и сайт (тёмная тема, шрифт) */
function IframeSync({ children, document: doc }: { children: React.ReactNode; document?: Document }) {
  useFreeDrag(doc);
  const selectedId = usePuckSelector((s) => String(s.selectedItem?.props?.id ?? ''));
  const selectedType = usePuckSelector((s) => s.selectedItem?.type ?? '');
  useResizeHandles(doc, selectedId, selectedType);
  useEffect(() => {
    if (!doc) return;
    doc.documentElement.className = window.document.documentElement.className;
    doc.body.className = window.document.body.className;
    // Ссылки и формы на холсте не должны уводить со страницы редактора
    const stopLink = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('a[href]')) e.preventDefault();
    };
    const stopSubmit = (e: Event) => e.preventDefault();
    doc.addEventListener('click', stopLink, true);
    doc.addEventListener('submit', stopSubmit, true);
    // Выбор в «Структуре» зовёт scrollIntoView — он прокручивает и блоки сайта с overflow:hidden, и оболочку
    // редактора, откуда колесом уже не вернуть. Двигаем только само окно холста.
    const win = doc.defaultView;
    const proto = win?.Element.prototype;
    const nativeScrollIntoView = proto?.scrollIntoView;
    if (win && proto && nativeScrollIntoView) {
      proto.scrollIntoView = function (this: Element, arg?: boolean | ScrollIntoViewOptions) {
        const scroller = doc.scrollingElement;
        if (!this.hasAttribute('data-puck-component') || !scroller || scroller.scrollHeight <= win.innerHeight + 1) {
          nativeScrollIntoView.call(this, arg);
          return;
        }
        const rect = this.getBoundingClientRect();
        const room = win.innerHeight - rect.height;
        const offset = room > 160 ? room / 2 : 140;
        win.scrollTo({ top: Math.max(0, win.scrollY + rect.top - offset), behavior: 'smooth' });
      };
    }
    return () => {
      doc.removeEventListener('click', stopLink, true);
      doc.removeEventListener('submit', stopSubmit, true);
      if (proto && nativeScrollIntoView) proto.scrollIntoView = nativeScrollIntoView;
    };
  }, [doc]);
  return <>{children}</>;
}

export function PageBuilder({
  initialData,
  assetMap,
  headerTitle,
  headerPath,
  publicUrl,
  dirty,
  saving,
  onChange,
  onSave,
}: {
  initialData: BuilderData;
  assetMap: Record<string, string>;
  headerTitle: string;
  headerPath: string;
  publicUrl: string;
  dirty: boolean;
  saving: boolean;
  onChange: (data: Data) => void;
  onSave: (data: Data) => void;
}) {
  const saveState = useMemo(() => ({ dirty, saving, onSave, publicUrl }), [dirty, saving, onSave, publicUrl]);
  const overrides = useMemo(
    () => ({ iframe: IframeSync, headerActions: HeaderActions, actionBar: NamedActionBar }),
    [],
  );

  return (
    <MediaLibraryProvider assetMap={assetMap}>
      <SaveContext.Provider value={saveState}>
        <div className="cms-puck-host overflow-hidden rounded-md border border-zinc-800 bg-white text-zinc-900">
          <Puck
            config={builderConfig}
            data={initialData as Data}
            onChange={onChange}
            onPublish={onSave}
            dictionary={DICTIONARY}
            viewports={VIEWPORTS}
            iframe={{ enabled: true, waitForStyles: true }}
            overrides={overrides}
            fieldTransforms={FIELD_TRANSFORMS}
            headerTitle={headerTitle}
            headerPath={headerPath}
            height="calc(100vh - 12rem)"
          />
        </div>
      </SaveContext.Provider>
    </MediaLibraryProvider>
  );
}
