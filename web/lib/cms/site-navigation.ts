import type { NavMenuItem, SiteNavConfig } from '@/lib/navigation-config';
import { STATIC_NAV } from '@/lib/navigation-config';
import { isDbConfigured, prisma } from '@/lib/db';

type NavSectionKey = 'NONE' | 'FRICTION' | 'MECH' | 'USLUGI' | 'TOP_LINK';

export type { SiteNavConfig } from '@/lib/navigation-config';
export { STATIC_NAV } from '@/lib/navigation-config';

function pageToNavItem(page: { slug: string; title: string }): NavMenuItem {
  return {
    href: page.slug === '' ? '/' : `/${page.slug}`,
    label: page.title,
  };
}

function mergeNavItems(staticItems: NavMenuItem[], dbItems: NavMenuItem[]): NavMenuItem[] {
  const seen = new Set<string>();
  const result: NavMenuItem[] = [];

  for (const item of staticItems) {
    const key = (item.href ?? item.label).toString();
    seen.add(key);
    result.push(item);
  }

  for (const item of dbItems) {
    const key = (item.href ?? item.label).toString();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

function buildCategoryTree(
  categories: { id: string; title: string; parentId: string | null; sortOrder: number }[],
  pages: { slug: string; title: string; categoryId: string | null; sortOrder: number; showInNav: boolean }[],
  parentId: string | null,
): NavMenuItem[] {
  const cats = categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru'));

  const items: NavMenuItem[] = [];

  for (const cat of cats) {
    const catPages = pages
      .filter((p) => p.categoryId === cat.id && p.showInNav)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru'))
      .map(pageToNavItem);

    const subCats = buildCategoryTree(categories, pages, cat.id);
    const children = [...subCats, ...catPages];

    if (children.length > 0) {
      items.push({ label: cat.title, children });
    }
  }

  const rootPages = pages
    .filter((p) => p.categoryId === parentId && p.showInNav)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru'))
    .map(pageToNavItem);

  return [...items, ...rootPages];
}

async function buildSectionNav(
  section: NavSectionKey,
  staticItems: NavMenuItem[],
): Promise<NavMenuItem[]> {
  const categories = await prisma.pageCategory.findMany({
    where: { navSection: section },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
  });

  const pages = await prisma.page.findMany({
    where: { navSection: section, published: true, showInNav: true },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    select: { slug: true, title: true, categoryId: true, sortOrder: true, showInNav: true },
  });

  if (categories.length === 0 && pages.length === 0) {
    return staticItems;
  }

  const dbTree = buildCategoryTree(categories, pages, null);
  const uncategorized = pages
    .filter((p) => !p.categoryId)
    .map(pageToNavItem);

  return mergeNavItems(staticItems, [...dbTree, ...uncategorized]);
}

export async function getSiteNavigation(): Promise<SiteNavConfig> {
  if (!isDbConfigured()) return STATIC_NAV;

  try {
    const [friction, mech, uslugi, topPages] = await Promise.all([
      buildSectionNav('FRICTION', STATIC_NAV.friction),
      buildSectionNav('MECH', STATIC_NAV.mech),
      buildSectionNav('USLUGI', STATIC_NAV.uslugi),
      prisma.page.findMany({
        where: { navSection: 'TOP_LINK', published: true, showInNav: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        select: { slug: true, title: true },
      }),
    ]);

    const topLinks = mergeNavItems(
      STATIC_NAV.topLinks,
      topPages.map(pageToNavItem),
    );

    return { friction, mech, uslugi, topLinks };
  } catch {
    return STATIC_NAV;
  }
}
