import { NextResponse } from 'next/server';
import { getMediaOverrideMap } from '@/lib/cms/media-overrides';

export async function GET() {
  const overrides = await getMediaOverrideMap();
  return NextResponse.json({ overrides });
}
