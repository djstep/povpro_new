import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InquiryPageContent } from '@/components/inquiry/InquiryPageContent';

export const metadata: Metadata = {
  title: 'Place an Order',
};

export default function EnZakazPage() {
  return (
    <Suspense fallback={<div className="site-content font-body-md text-body-md w-full min-h-[60vh] pt-40 md:pt-48" />}>
      <InquiryPageContent />
    </Suspense>
  );
}
