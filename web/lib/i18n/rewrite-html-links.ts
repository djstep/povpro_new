/** Prefix internal site links with /en when rendering English pages. */
export function rewriteHtmlLinksForLocale(html: string, locale: 'ru' | 'en'): string {
  if (locale !== 'en') return html;

  return html.replace(/\bhref=(["'])(\/[^"']*)\1/gi, (full, quote: string, href: string) => {
    if (
      href.startsWith('/en') ||
      href.startsWith('/assets/') ||
      href.startsWith('/api/') ||
      href.startsWith('//') ||
      href.startsWith('/#')
    ) {
      return full;
    }
    if (href === '/') return `href=${quote}/en${quote}`;
    return `href=${quote}/en${href}${quote}`;
  });
}
