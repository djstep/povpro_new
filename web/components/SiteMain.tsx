/** Контент страницы (HTML из Stitch, извлечённый при миграции) */
export function SiteMain({ html }: { html: string }) {
  return (
    <div
      className="site-content font-body-md text-body-md w-full"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
