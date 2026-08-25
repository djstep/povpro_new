/** Локальные файлы галереи в public (webp предпочтительнее для тяжёлых jpg). */
const LOCAL_GALLERY_WEBP_IDS = new Set([22, 25, 26]);

export type HomeGalleryItem =
  | { kind: 'image'; id: number }
  | { kind: 'video'; src: string; poster?: string };

export function homeGalleryItemKey(item: HomeGalleryItem): string {
  return item.kind === 'image' ? `image-${item.id}` : `video-${item.src}`;
}

export function homeGalleryImageUrl(id: number): string {
  if (LOCAL_GALLERY_WEBP_IDS.has(id)) {
    return `/assets/img/povpro-gallery-${id}.webp`;
  }
  return `/assets/img/povpro-gallery-${id}.jpg`;
}

/** Все фото и видео галереи «Производство в деталях» — единый список */
export const ALL_HOME_GALLERY_ITEMS: HomeGalleryItem[] = [
  { kind: 'image', id: 13 },
  { kind: 'image', id: 1 },
  { kind: 'image', id: 17 },
  { kind: 'image', id: 10 },
  { kind: 'image', id: 15 },
  { kind: 'image', id: 7 },
  { kind: 'image', id: 16 },
  { kind: 'image', id: 11 },
  { kind: 'image', id: 6 },
  { kind: 'image', id: 22 },
  { kind: 'image', id: 2 },
  { kind: 'image', id: 9 },
  { kind: 'image', id: 18 },
  { kind: 'image', id: 20 },
  { kind: 'image', id: 8 },
  { kind: 'image', id: 3 },
  { kind: 'image', id: 4 },
  { kind: 'image', id: 5 },
  { kind: 'image', id: 27 },
  { kind: 'image', id: 12 },
  { kind: 'image', id: 14 },
  { kind: 'image', id: 21 },
  { kind: 'image', id: 23 },
  { kind: 'image', id: 26 },
  { kind: 'image', id: 25 },
  { kind: 'image', id: 19 },
  { kind: 'image', id: 24 },
  {
    kind: 'video',
    src: '/assets/video/gallery-video-2.mp4',
    poster: '/assets/img/povpro-gallery-22.webp',
  },
];
