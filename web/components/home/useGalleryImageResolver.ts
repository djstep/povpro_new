'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  homeGalleryImageUrl,
  type HomeGalleryItem,
} from '@/lib/home-gallery';

export function useGalleryMediaResolver() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch('/api/cms/media-overrides')
      .then((r) => r.json())
      .then((data: { overrides?: Record<string, string> }) => setOverrides(data.overrides ?? {}))
      .catch(() => undefined);
  }, []);

  const resolveImage = useCallback(
    (id: number) => {
      const resolved = homeGalleryImageUrl(id);
      const localPath = `/assets/img/povpro-gallery-${id}.jpg`;
      return overrides[resolved] ?? overrides[localPath] ?? resolved;
    },
    [overrides],
  );

  const resolvePoster = useCallback(
    (src: string | undefined) => {
      if (!src) return undefined;
      return overrides[src] ?? src;
    },
    [overrides],
  );

  const resolveVideo = useCallback(
    (src: string) => overrides[src] ?? src,
    [overrides],
  );

  return { resolveImage, resolvePoster, resolveVideo };
}

export function getGalleryCardPoster(item: HomeGalleryItem, resolveImage: (id: number) => string): string | undefined {
  if (item.kind === 'video') return item.poster;
  return resolveImage(item.id);
}
