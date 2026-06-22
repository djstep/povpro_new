'use client';

import { useCallback, useEffect, useState } from 'react';
import { homeGalleryImageUrl } from '@/lib/home-gallery';

export function useGalleryImageResolver() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch('/api/cms/media-overrides')
      .then((r) => r.json())
      .then((data: { overrides?: Record<string, string> }) => setOverrides(data.overrides ?? {}))
      .catch(() => undefined);
  }, []);

  return useCallback(
    (id: number) => {
      const resolved = homeGalleryImageUrl(id);
      const localPath = `/assets/img/povpro-gallery-${id}.jpg`;
      return overrides[resolved] ?? overrides[localPath] ?? resolved;
    },
    [overrides],
  );
}
