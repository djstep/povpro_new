import type { RouteKey } from './routes';

export function hrefFor(slug: string): string {
  return slug === '' ? '/' : `/${slug}`;
}

export function isActivePath(
  currentSlug: string,
  targetSlug: string,
  prefixMatch?: RegExp
): boolean {
  if (currentSlug === targetSlug) return true;
  if (targetSlug && currentSlug.startsWith(targetSlug + '/')) return true;
  if (prefixMatch) return prefixMatch.test('/' + currentSlug);
  return false;
}

export const MECH_PREFIX =
  /^\/(mekhanicheskaya-obrabotka|proizvodstvo|izgotovlenie-|zuboreznye|shlifovalnye|frezernye|tokarnye|koordinatno|elektroerozionnye|dolbezhnye)/;

export const USLUGI_PREFIX =
  /^\/(metalloobrabotka|mashiny-dlya|remont-mashin|termoobrabotka|remont-kuznechno|izgotovlenie-kalyanov)/;

export type NavLink = { href: RouteKey | string; label: string };

export const FRICTION_CHILDREN: NavLink[] = [
  { href: '/frikcionnye-nakladki/nashi-izdeliya', label: 'Наши фрикционные изделия' },
  { href: '/frikcionnye-nakladki/tu', label: 'Технические условия' },
];

export const MECH_CHILDREN: NavLink[] = [
  { href: '/proizvodstvo_detalej', label: 'Продукция' },
  { href: '/proizvodstvo-press-form-i-shtampov', label: 'Штампы и пресс-формы' },
  { href: '/izgotovlenie-valov', label: 'Валы' },
  { href: '/izgotovlenie-shesteren-i-zubchatyh-koles', label: 'Шестерни и зубчатые колеса' },
  { href: '/zuboreznye-raboty', label: 'Зуборезные работы' },
  { href: '/shlifovalnye-raboty', label: 'Шлифовальные работы' },
  { href: '/frezernye-raboty', label: 'Фрезерные работы' },
  { href: '/tokarnye-raboty', label: 'Токарные работы' },
  { href: '/koordinatno-rastochnye-raboty', label: 'Координатно-расточные работы' },
  { href: '/elektroerozionnye-raboty', label: 'Электроэрозионные работы' },
  { href: '/dolbezhnye-raboty', label: 'Долбежные работы' },
];

export const USLUGI_CHILDREN: NavLink[] = [
  { href: '/mashiny-dlya-litya-pod-davleniem', label: 'Продажа МЛД' },
  { href: '/remont-mashin-dlya-litya-pod-davleniem', label: 'Ремонт МЛД' },
  { href: '/termoobrabotka', label: 'Термообработка' },
  { href: '/remont-kuznechno-pressovogo-oborudovaniya', label: 'Ремонт КПО' },
  { href: '/izgotovlenie-kalyanovs', label: 'Изготовление кальянов' },
];
