import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDbConfigured, prisma } from '@/lib/db';

const schema = z.object({
  sessionId: z.string().min(8).max(100),
  eventType: z.string().min(1).max(80),
  path: z.string().max(500).optional(),
  referrer: z.string().max(2000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        sessionId: parsed.data.sessionId,
        eventType: parsed.data.eventType,
        path: parsed.data.path ?? null,
        referrer: parsed.data.referrer ?? null,
        utmSource: parsed.data.utmSource ?? null,
        utmMedium: parsed.data.utmMedium ?? null,
        utmCampaign: parsed.data.utmCampaign ?? null,
        utmContent: parsed.data.utmContent ?? null,
        utmTerm: parsed.data.utmTerm ?? null,
        metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
      },
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    console.error('[analytics]', e);
    return NextResponse.json({ ok: true, stored: false });
  }
}
