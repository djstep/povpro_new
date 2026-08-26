'use client';

import { usePathname } from 'next/navigation';

/** Soft fade when navigating between site pages. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
