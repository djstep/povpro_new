/** PNG и прочие файлы из репозитория (fallback CDN) */
const GITHUB_ASSETS =
  process.env.NEXT_PUBLIC_ASSET_CDN ??
  'https://raw.githubusercontent.com/djstep/povpro_new/main/web/public/assets/img';

export function resolveAssetUrl(assetPath: string): string {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const gallery = normalized.match(/^\/assets\/img\/povpro-gallery-(\d+)\.jpg$/);
  if (gallery) return `/assets/img/povpro-gallery-${gallery[1]}.jpg`;

  const file = normalized.replace(/^\/assets\/img\//, '');
  return `${GITHUB_ASSETS}/${file}`;
}
