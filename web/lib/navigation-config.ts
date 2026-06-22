import {
  FRICTION_CHILDREN,
  MECH_CHILDREN,
  USLUGI_CHILDREN,
  type NavMenuItem,
} from '@/lib/navigation';

export type { NavMenuItem };

export type SiteNavConfig = {
  friction: NavMenuItem[];
  mech: NavMenuItem[];
  uslugi: NavMenuItem[];
  topLinks: NavMenuItem[];
};

export const STATIC_NAV: SiteNavConfig = {
  friction: FRICTION_CHILDREN,
  mech: MECH_CHILDREN,
  uslugi: USLUGI_CHILDREN,
  topLinks: [{ href: '/irt', label: 'Интеллектуальные системы' }],
};
