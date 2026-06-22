import { isDbConfigured, prisma } from '@/lib/db';

export async function getMediaOverrideMap(): Promise<Record<string, string>> {
  if (!isDbConfigured()) return {};
  try {
    const rows = await prisma.mediaOverride.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.originalSrc] = row.replacementSrc;
    }
    return map;
  } catch {
    return {};
  }
}

export function applyOverrideToSrc(src: string, map: Record<string, string>): string {
  return map[src] ?? src;
}
