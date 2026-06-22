'use client';

import { createContext, useContext } from 'react';
import type { SiteNavConfig } from '@/lib/navigation-config';
import { STATIC_NAV } from '@/lib/navigation-config';

const NavigationContext = createContext<SiteNavConfig>(STATIC_NAV);

export function NavigationProvider({
  nav,
  children,
}: {
  nav: SiteNavConfig;
  children: React.ReactNode;
}) {
  return <NavigationContext.Provider value={nav}>{children}</NavigationContext.Provider>;
}

export function useSiteNavigation(): SiteNavConfig {
  return useContext(NavigationContext);
}
