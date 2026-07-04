import { MECH_CHILDREN, USLUGI_CHILDREN, type NavMenuItem } from '@/lib/navigation';

export type { NavMenuItem };

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
