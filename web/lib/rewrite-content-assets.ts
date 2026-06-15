import fs from 'fs';
import path from 'path';
import { resolveAssetUrl } from './resolve-asset-urls';

const publicImgDir = path.join(process.cwd(), 'public', 'assets', 'img');

/** Локальный файл из public/ — иначе CDN (GitHub / povpro.ru) */
function resolveContentAssetUrl(assetPath: string): string {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const match = normalized.match(/^\/assets\/img\/(.+)$/);
  if (match && fs.existsSync(path.join(publicImgDir, match[1]))) {
    return normalized;
  }
  return resolveAssetUrl(assetPath);
}

/** Подмена /assets/img/… на внешние URL перед рендером HTML-контента */
export function rewriteContentAssets(html: string): string {
  let out = html;

  out = out.replace(/url\((['"]?)\/assets\/img\/([^'")]+)\1\)/g, (_, _q, file) => {
    return `url('${resolveContentAssetUrl(`/assets/img/${file}`)}')`;
  });

  out = out.replace(/src="\/assets\/img\/([^"]+)"/g, (_, file) => {
    return `src="${resolveContentAssetUrl(`/assets/img/${file}`)}"`;
  });

  let imgIndex = 0;
  out = out.replace(/<img(?![^>]*\bloading=)/gi, () => {
    imgIndex += 1;
    if (imgIndex === 1) return '<img fetchpriority="high" ';
    return '<img loading="lazy" decoding="async" ';
  });

  return out;
}
