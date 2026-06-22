/** Контент страницы — HTML уже обработан (медиа, тексты, CDN) в resolvePageHtml */
export function SiteMain({ html }: { html: string }) {
  return (
    <div
      className="site-content font-body-md text-body-md w-full"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
