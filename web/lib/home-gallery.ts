import { resolveAssetUrl } from './resolve-asset-urls';

export type HomeGalleryItem = {
  id: number;
  title: string;
  tag: string;
};

export type HomeGallerySection = {
  id: string;
  title: string;
  description: string;
  items: HomeGalleryItem[];
};

function img(id: number): string {
  return resolveAssetUrl(`/assets/img/povpro-gallery-${id}.jpg`);
}

export function homeGalleryImageUrl(id: number): string {
  return img(id);
}

/** Полная галерея «Производство в деталях» — 4 раздела, 27 фото */
export const HOME_GALLERY_SECTIONS: HomeGallerySection[] = [
  {
    id: 'cnc',
    title: 'ЧПУ и мехобработка',
    description: 'Токарные, фрезерные и универсальные операции высокой точности.',
    items: [
      { id: 13, title: 'Деталь ротора', tag: 'ЧПУ Токарная' },
      { id: 1, title: 'Корпус редуктора', tag: 'Фрезеровка 5-осей' },
      { id: 17, title: 'Мехобработка гидропанели', tag: 'Гидравлика' },
      { id: 10, title: 'Крыльчатка насоса', tag: 'Центробежные насосы' },
      { id: 15, title: 'Корпусные детали', tag: 'Корпуса' },
      { id: 7, title: 'Топливный насос', tag: 'Топливные системы' },
      { id: 16, title: 'Матрицы и штампы', tag: 'Инструмент' },
      { id: 11, title: 'Фасонный резец', tag: 'Режущий инструмент' },
      { id: 6, title: 'Коническая шестерня', tag: 'Зубчатые передачи' },
    ],
  },
  {
    id: 'equipment',
    title: 'Станки и оборудование',
    description: 'Парк высокотехнологичного оборудования предприятия.',
    items: [
      { id: 22, title: 'Производственный цех', tag: 'Цех' },
      { id: 2, title: 'Электроэрозионный станок DK7750H', tag: 'EDM' },
      { id: 9, title: 'Координатно-расточный станок', tag: 'Расточка' },
      { id: 18, title: 'Токарный станок с ЧПУ', tag: 'Токарная' },
      { id: 20, title: 'Шлифовальный станок', tag: 'Шлифование' },
      { id: 8, title: 'Процесс шлифования', tag: 'Шлифование' },
      { id: 3, title: 'Универсальный станок', tag: 'Мехобработка' },
      { id: 4, title: 'Обрабатывающий центр', tag: 'ЧПУ' },
      { id: 5, title: 'Сверлильно-фрезерный участок', tag: 'Участок' },
    ],
  },
  {
    id: 'assembly',
    title: 'Сборка и узлы',
    description: 'Комплексная сборка механических узлов и агрегатов.',
    items: [
      { id: 27, title: 'Готовый узел', tag: 'Сборка' },
      { id: 12, title: 'Сборочный участок', tag: 'Сборка' },
      { id: 14, title: 'Механический узел', tag: 'Узлы' },
      { id: 21, title: 'Готовая продукция', tag: 'Продукция' },
      { id: 23, title: 'Испытания узла', tag: 'Контроль' },
    ],
  },
  {
    id: 'finishing',
    title: 'Термообработка и отделка',
    description: 'Закалка, шлифование и финишная обработка деталей.',
    items: [
      { id: 26, title: 'Зубодолбёжные работы', tag: 'Долбление' },
      { id: 25, title: 'Шлифовальные круги', tag: 'Абразивы' },
      { id: 19, title: 'Закалка ТВЧ', tag: 'Термообработка' },
      { id: 24, title: 'Азотирование', tag: 'Химико-термическая' },
    ],
  },
];

/** Плоский список всех фото для навигации в lightbox */
export const ALL_HOME_GALLERY_ITEMS: HomeGalleryItem[] = HOME_GALLERY_SECTIONS.flatMap(
  (section) => section.items,
);
