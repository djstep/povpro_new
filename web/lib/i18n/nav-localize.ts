import type { NavMenuItem } from '@/lib/navigation';
import type { SiteNavConfig } from '@/lib/navigation-config';
import type { Locale } from './config';
import { navLabelForHref, type Dictionary } from './dictionary';
import { localizedPath } from './locale';

export function localizeNavItem(
  item: NavMenuItem,
  locale: Locale,
  dictionary: Dictionary,
): NavMenuItem {
  const href = item.href as string | undefined;
  return {
    ...item,
    label: href ? navLabelForHref(href, dictionary, item.label) : item.label,
    href: href ? localizedPath(href, locale) : item.href,
    children: item.children?.map((child) => localizeNavItem(child, locale, dictionary)),
  };
}

export function localizeNavConfig(
  config: SiteNavConfig,
  locale: Locale,
  dictionary: Dictionary,
): SiteNavConfig {
  return {
    mech: config.mech.map((item) => localizeNavItem(item, locale, dictionary)),
    uslugi: config.uslugi.map((item) => localizeNavItem(item, locale, dictionary)),
    topLinks: config.topLinks.map((item) => localizeNavItem(item, locale, dictionary)),
  };
}
