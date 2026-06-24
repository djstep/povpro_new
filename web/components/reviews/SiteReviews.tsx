'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type SiteReview = {
  id: string;
  author: string;
  company: string | null;
  text: string;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function ReviewCard({ review }: { review: SiteReview }) {
  const name = review.company ? `${review.author} (${review.company})` : review.author;
  return (
    <div className="liquid-glass p-8 md:px-16 md:py-12 flex flex-col md:flex-row gap-8 items-center justify-between group hover:bg-surface-variant/40 transition-all duration-300 min-h-[300px] rounded-[3rem] md:rounded-full w-full max-w-7xl">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface border border-white/10 shrink-0 flex items-center justify-center p-4">
        <span className="material-symbols-outlined text-4xl text-primary opacity-70">person</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="font-body-md text-body-md text-on-surface font-medium">{name}</h4>
          <div className="h-1 w-1 bg-outline rounded-full" />
          <span className="font-mono-label text-mono-label text-outline">
            {formatDate(review.createdAt)}
          </span>
        </div>
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-medium leading-relaxed">
          «{review.text}»
        </p>
      </div>
    </div>
  );
}

export function SiteReviews() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [reviews, setReviews] = useState<SiteReview[]>([]);

  useEffect(() => {
    setAnchor(document.getElementById('db-reviews-anchor'));
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : { reviews: [] }))
      .then((data: { reviews?: SiteReview[] }) => {
        if (active && Array.isArray(data.reviews)) setReviews(data.reviews);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!anchor || reviews.length === 0) return null;

  return createPortal(
    <>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </>,
    anchor,
  );
}
