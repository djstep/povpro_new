import { MECH_CHILDREN, USLUGI_CHILDREN, type NavMenuItem } from '@/lib/navigation';

export type { NavMenuItem };

/** Dictionary keys for top-level nav labels (see lib/i18n/dictionary.ts nav section). */
export const NAV_LABEL_KEYS = {
  home: 'home',
  machining: 'machining',
  intelligentSystems: 'intelligentSystems',
  services: 'services',
  contacts: 'contacts',
  reviews: 'reviews',
} as const;

export type NavLabelKey = (typeof NAV_LABEL_KEYS)[keyof typeof NAV_LABEL_KEYS];

export type SiteNavConfig = {
  mech: NavMenuItem[];
  uslugi: NavMenuItem[];
  topLinks: NavMenuItem[];
};

export const STATIC_NAV: SiteNavConfig = {
  mech: MECH_CHILDREN,
  uslugi: USLUGI_CHILDREN,
  topLinks: [{ href: '/irt', label: 'Интеллектуальные системы' }],
};
