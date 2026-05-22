/** Галерея с рабочего сайта povpro.ru */
const POVPRO_GALLERY = 'https://povpro.ru/views/resp_ppo/images';

/** PNG и прочие файлы из репозитория (Vercel не отдаёт /assets/img локально) */
const GITHUB_ASSETS =
  process.env.NEXT_PUBLIC_ASSET_CDN ??
  'https://raw.githubusercontent.com/djstep/povpro_new/main/web/public/assets/img';

export function resolveAssetUrl(assetPath: string): string {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const gallery = normalized.match(/^\/assets\/img\/povpro-gallery-(\d+)\.jpg$/);
  if (gallery) return `${POVPRO_GALLERY}/gallery-${gallery[1]}.jpg`;

  const file = normalized.replace(/^\/assets\/img\//, '');
  return `${GITHUB_ASSETS}/${file}`;
}

/** Подмена /assets/img/… на внешние URL перед рендером HTML-контента */
export function rewriteContentAssets(html: string): string {
  let out = html;

  out = out.replace(/url\((['"]?)\/assets\/img\/([^'")]+)\1\)/g, (_, _q, file) => {
    return `url('${resolveAssetUrl(`/assets/img/${file}`)}')`;
  });

  out = out.replace(/src="\/assets\/img\/([^"]+)"/g, (_, file) => {
    return `src="${resolveAssetUrl(`/assets/img/${file}`)}"`;
  });

  let imgIndex = 0;
  out = out.replace(/<img(?![^>]*\bloading=)/gi, () => {
    imgIndex += 1;
    if (imgIndex === 1) return '<img fetchpriority="high" ';
    return '<img loading="lazy" decoding="async" ';
  });

  return out;
}
