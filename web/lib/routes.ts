/** Маршруты сайта (как на povpro.ru) */
export const ROUTES = {
  '/': { slug: '', title: 'Главная' },
  '/frikcionnye-nakladki': { slug: 'frikcionnye-nakladki', title: 'Фрикционные накладки' },
  '/frikcionnye-nakladki/nashi-izdeliya': {
    slug: 'frikcionnye-nakladki/nashi-izdeliya',
    title: 'Наши фрикционные изделия',
  },
  '/frikcionnye-nakladki/tu': { slug: 'frikcionnye-nakladki/tu', title: 'Технические условия' },
  '/mekhanicheskaya-obrabotka': { slug: 'mekhanicheskaya-obrabotka', title: 'Мехобработка' },
  '/proizvodstvo_detalej': { slug: 'proizvodstvo_detalej', title: 'Продукция' },
  '/proizvodstvo-press-form-i-shtampov': {
    slug: 'proizvodstvo-press-form-i-shtampov',
    title: 'Штампы и пресс-формы',
  },
  '/izgotovlenie-valov': { slug: 'izgotovlenie-valov', title: 'Валы' },
  '/izgotovlenie-shesteren-i-zubchatyh-koles': {
    slug: 'izgotovlenie-shesteren-i-zubchatyh-koles',
    title: 'Шестерни и зубчатые колеса',
  },
  '/zuboreznye-raboty': { slug: 'zuboreznye-raboty', title: 'Зуборезные работы' },
  '/shlifovalnye-raboty': { slug: 'shlifovalnye-raboty', title: 'Шлифовальные работы' },
  '/frezernye-raboty': { slug: 'frezernye-raboty', title: 'Фрезерные работы' },
  '/tokarnye-raboty': { slug: 'tokarnye-raboty', title: 'Токарные работы' },
  '/koordinatno-rastochnye-raboty': {
    slug: 'koordinatno-rastochnye-raboty',
    title: 'Координатно-расточные работы',
  },
  '/elektroerozionnye-raboty': {
    slug: 'elektroerozionnye-raboty',
    title: 'Электроэрозионные работы',
  },
  '/dolbezhnye-raboty': { slug: 'dolbezhnye-raboty', title: 'Долбежные работы' },
  '/irt': { slug: 'irt', title: 'Интеллектуальные системы' },
  '/metalloobrabotka': { slug: 'metalloobrabotka', title: 'Услуги' },
  '/mashiny-dlya-litya-pod-davleniem': {
    slug: 'mashiny-dlya-litya-pod-davleniem',
    title: 'Продажа МЛД',
  },
  '/remont-mashin-dlya-litya-pod-davleniem': {
    slug: 'remont-mashin-dlya-litya-pod-davleniem',
    title: 'Ремонт МЛД',
  },
  '/termoobrabotka': { slug: 'termoobrabotka', title: 'Термообработка' },
  '/remont-kuznechno-pressovogo-oborudovaniya': {
    slug: 'remont-kuznechno-pressovogo-oborudovaniya',
    title: 'Ремонт кузнечно-прессового оборудования',
  },
  '/izgotovlenie-kalyanovs': { slug: 'izgotovlenie-kalyanovs', title: 'Изготовление кальянов' },
  '/contacts': { slug: 'contacts', title: 'Контакты' },
  '/otzyvy-o-ppo': { slug: 'otzyvy-o-ppo', title: 'Отзывы' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function slugToPath(slug: string): RouteKey {
  if (slug === '') return '/';
  const key = `/${slug}` as RouteKey;
  return ROUTES[key] ? key : ('/' as RouteKey);
}

export function pathToSlug(path: string): string {
  if (path === '/') return '';
  return path.replace(/^\//, '');
}
