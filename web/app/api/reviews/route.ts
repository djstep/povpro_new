import { NextResponse } from 'next/server';
import { isDbConfigured, prisma } from '@/lib/db';

export const revalidate = 300;

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ reviews: [] });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, author: true, company: true, text: true, createdAt: true },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        author: r.author,
        company: r.company,
        // отрезаем служебный блок вложений (имена файлов), добавляемый при отправке
        text: r.text.split('\n\n---\n')[0]!.trim(),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
