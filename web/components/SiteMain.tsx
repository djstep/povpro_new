import { rewriteContentAssets } from '@/lib/rewrite-content-assets';

/** Контент страницы (HTML из Stitch, извлечённый при миграции) */
export function SiteMain({ html }: { html: string }) {
  const processed = rewriteContentAssets(html);

  return (
    <div
      className="site-content font-body-md text-body-md w-full"
      dangerouslySetInnerHTML={{ __html: processed }}
      suppressHydrationWarning
    />
  );
}
