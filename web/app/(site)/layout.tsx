import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { InquiryBridge } from '@/components/inquiry/InquiryBridge';
import { HomeGalleryBridge } from '@/components/home/HomeGalleryBridge';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <MobileNav />
      <InquiryBridge />
      <HomeGalleryBridge />
    </>
  );
}
