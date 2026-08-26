import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import { resolveAssetUrl } from './resolve-asset-urls';

const publicImgDir = path.join(process.cwd(), 'public', 'assets', 'img');

/** Один проход по public/assets/img за запрос вместо fs.existsSync на каждую картинку в HTML. */
const getPublicImgIndex = cache((): Set<string> => {
  const index = new Set<string>();
  function walk(dir: string, rel = '') {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = (rel ? `${rel}/` : '') + entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath);
      } else {
        index.add(relPath.replace(/\\/g, '/'));
      }
    }
  }
  walk(publicImgDir);
  return index;
});

/** Локальный файл из public/ — иначе CDN (GitHub / povpro.ru).
 *  Если рядом есть .webp-версия — отдаём её (оригинал остаётся запасным вариантом). */
function resolveContentAssetUrl(assetPath: string, imgIndex: Set<string>): string {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const match = normalized.match(/^\/assets\/img\/(.+)$/);
  if (match) {
    const rel = match[1];
    const webpRel = rel.replace(/\.(png|jpe?g)$/i, '.webp');
    if (webpRel !== rel && imgIndex.has(webpRel)) {
      return `/assets/img/${webpRel}`;
    }
    if (imgIndex.has(rel)) {
      return normalized;
    }
  }
  return resolveAssetUrl(assetPath);
}

/** Подмена /assets/img/… на внешние URL перед рендером HTML-контента */
export function rewriteContentAssets(html: string): string {
  const imgIndex = getPublicImgIndex();
  let out = html;

  out = out.replace(/url\((['"]?)\/assets\/img\/([^'")]+)\1\)/g, (_, _q, file) => {
    return `url('${resolveContentAssetUrl(`/assets/img/${file}`, imgIndex)}')`;
  });

  out = out.replace(/src="\/assets\/img\/([^"]+)"/g, (_, file) => {
    return `src="${resolveContentAssetUrl(`/assets/img/${file}`, imgIndex)}"`;
  });

  let imgEagerIndex = 0;
  out = out.replace(/<img(?![^>]*\bloading=)/gi, () => {
    imgEagerIndex += 1;
    if (imgEagerIndex === 1) return '<img fetchpriority="high" loading="eager" decoding="async" ';
    return '<img loading="eager" decoding="async" ';
  });

  // Уже размеченные lazy — грузим сразу (схемы фрикционов оставляем lazy)
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/friction-table-schema/i.test(tag)) return tag;
    return tag.replace(/\bloading=(["'])lazy\1/gi, 'loading=$1eager$1');
  });

  out = out.replace(/<video(?![^>]*\bpreload=)/gi, '<video preload="auto" ');

  return out;
}
