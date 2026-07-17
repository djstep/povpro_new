import { LOCALE_PREFIX, type Locale } from './config';

export type ParsedLocaleSlug = {
  locale: Locale;
  slugKey: string;
  slugParts: string[];
};

/** Parse locale from Next.js `[[...slug]]` param segments. */
export function parseLocaleFromSlug(slug?: string[]): ParsedLocaleSlug {
  if (!slug || slug.length === 0) {
    return { locale: 'ru', slugKey: '', slugParts: [] };
  }
  if (slug[0] === 'en') {
    const rest = slug.slice(1);
    return { locale: 'en', slugKey: rest.join('/'), slugParts: rest };
  }
  return { locale: 'ru', slugKey: slug.join('/'), slugParts: slug };
}

export type ParsedPathname = ParsedLocaleSlug & {
  pathWithoutLocale: string;
};

/** Parse locale from a URL pathname (client-side). */
export function parseLocaleFromPathname(pathname: string): ParsedPathname {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const rest = pathname === '/en' ? '/' : pathname.slice('/en'.length);
    return {
      locale: 'en',
      pathWithoutLocale: rest,
      slugKey: rest === '/' ? '' : rest.replace(/^\//, ''),
      slugParts: rest === '/' ? [] : rest.replace(/^\//, '').split('/'),
    };
  }
  return {
    locale: 'ru',
    pathWithoutLocale: pathname,
    slugKey: pathname === '/' ? '' : pathname.replace(/^\//, ''),
    slugParts: pathname === '/' ? [] : pathname.replace(/^\//, '').split('/'),
  };
}

/** Prefix or strip locale segment on a site path (not a full URL). */
export function localizedPath(path: string, locale: Locale): string {
  const qIndex = path.indexOf('?');
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const query = qIndex >= 0 ? path.slice(qIndex) : '';

  let clean = pathname;
  if (clean === '/en' || clean.startsWith('/en/')) {
    clean = clean === '/en' ? '/' : clean.slice('/en'.length);
  }
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }
  const prefix = LOCALE_PREFIX[locale];
  if (clean === '/') return `${prefix || '/'}${query}`;
  return `${prefix}${clean}${query}`;
}

/** Switch the locale prefix on the current pathname, preserving the page path. */
export function switchLocalePath(pathname: string, nextLocale: Locale): string {
  const { pathWithoutLocale } = parseLocaleFromPathname(pathname);
  return localizedPath(pathWithoutLocale, nextLocale);
}
