import { Header } from '@/components/layout/Header';
import { MobileMenuProvider } from '@/components/layout/MobileMenuProvider';
import { NavigationProvider } from '@/components/layout/NavigationProvider';
import { Footer } from '@/components/layout/Footer';
import { InquiryBridge } from '@/components/inquiry/InquiryBridge';
import { HomeGalleryBridge } from '@/components/home/HomeGalleryBridge';
import { Suspense } from 'react';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { LocaleShell } from '@/components/i18n/LocaleShell';
import { getSiteNavigation } from '@/lib/cms/site-navigation';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const nav = await getSiteNavigation();

  return (
    <LocaleShell>
      <NavigationProvider nav={nav}>
        <MobileMenuProvider>
          <Header />
          {children}
          <Footer />
          <InquiryBridge />
          <HomeGalleryBridge />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
        </MobileMenuProvider>
      </NavigationProvider>
    </LocaleShell>
  );
}
