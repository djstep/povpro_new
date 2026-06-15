'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { inquiryPageUrl } from '@/lib/inquiry-url';

const TRIGGER_RE =
  /(запросить|отправить|оставить заявк|заказать|сделать заказ|консультация|узнать цен)/i;

function normalizeText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function isInquiryCtaStyle(el: HTMLElement): boolean {
  if (!el.matches('button, a')) return false;
  const cls = el.className;
  if (typeof cls !== 'string') return false;

  if (cls.includes('btn-primary') || cls.includes('btn-glass')) return true;
  if (el.matches('a[href="/zakaz"], a[href="#"]')) return true;

  if (cls.includes('bg-primary/20') && !cls.includes('rounded-full') && !cls.includes('py-')) return false;

  if (cls.includes('border-primary') && cls.includes('rounded-full')) return true;
  if (cls.includes('bg-primary-container')) return true;
  if (cls.includes('bg-primary') && !cls.includes('bg-primary/20') && !cls.includes('bg-primary/10')) return true;
  if (cls.includes('bg-primary/10') && cls.includes('rounded-full')) return true;
  if (cls.includes('bg-surface-variant') && cls.includes('rounded-full')) return true;
  if (cls.includes('bg-white/10') && cls.includes('rounded-full')) return true;
  if (cls.includes('bg-blue-accent')) return true;

  return false;
}

function isInquiryTrigger(el: HTMLElement): boolean {
  if (el.dataset.inquiryBound === 'true') return false;
  if (el.closest('[data-inquiry-skip]')) return false;
  if (el.closest('.site-nav, .site-footer, .site-mobile-nav')) return false;
  if (el.closest('form[data-inquiry-form]')) return false;
  if (el.matches('a[href="/zakaz"]')) return false;
  if (!isInquiryCtaStyle(el)) return false;
  return TRIGGER_RE.test(normalizeText(el));
}

function placeholderKey(
  ph: string,
  type: string
): 'name' | 'company' | 'phone' | 'email' | 'message' | null {
  const p = ph.toLowerCase();
  if (/компан|организац/.test(p)) return 'company';
  if (/^имя|фио|ваше имя/.test(p) || (p.includes('имя') && !p.includes('компан'))) return 'name';
  if (/телефон|phone|\+7/.test(p)) return 'phone';
  if (/email|e-mail|почт/.test(p)) return 'email';
  if (/опис|сообщ|задач|черт|коммент|потребност/.test(p)) return 'message';
  if (type === 'tel') return 'phone';
  if (type === 'email') return 'email';
  return null;
}

function readFormPayload(form: HTMLFormElement) {
  const data: {
    name: string;
    company: string;
    phone: string;
    email: string;
    message: string;
  } = {
    name: '',
    company: '',
    phone: '',
    email: '',
    message: '',
  };

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
    const value = el.value.trim();
    if (!value) return;
    const key = placeholderKey(el.placeholder ?? '', el.type);
    if (key === 'name' && !data.name) data.name = value;
    else if (key === 'company' && !data.company) data.company = value;
    else if (key === 'phone' && !data.phone) data.phone = value;
    else if (key === 'email' && !data.email) data.email = value;
    else if (key === 'message') data.message = value ? `${data.message}\n${value}`.trim() : data.message;
    else if (el.tagName === 'TEXTAREA' && !data.message) data.message = value;
    else if (el.type === 'text' && !data.name) data.name = value;
    else if (el.type === 'text' && !data.phone && !value.includes('@')) data.phone = value;
    else if (el.type === 'text' && !data.email && value.includes('@')) data.email = value;
  });

  return data;
}

export function InquiryBridge() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/zakaz') return;

    const root = document.querySelector('.site-content');
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const source = pathname === '/' ? 'home' : pathname.replace(/^\//, '');

    const goToInquiry = (params: {
      subject?: string;
      name?: string;
      company?: string;
      phone?: string;
      email?: string;
      contact?: string;
      message?: string;
    }) => {
      router.push(
        inquiryPageUrl({
          from: source,
          subject: params.subject,
          name: params.name,
          company: params.company,
          phone: params.phone,
          email: params.email,
          contact: params.contact,
          message: params.message,
        })
      );
    };

    const bindTriggers = () => {
      root.querySelectorAll<HTMLElement>('button, a').forEach((el) => {
        if (!isInquiryTrigger(el)) return;
        if (el.dataset.inquiryBound === 'true') return;

        const handler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          goToInquiry({});
        };

        el.addEventListener('click', handler);
        el.dataset.inquiryBound = 'true';
        cleanups.push(() => {
          el.removeEventListener('click', handler);
          delete el.dataset.inquiryBound;
        });
      });
    };

    const bindQuickWidgets = () => {
      root.querySelectorAll<HTMLElement>('button, a').forEach((btn) => {
        if (btn.dataset.inquiryBound === 'true') return;
        if (!TRIGGER_RE.test(normalizeText(btn))) return;
        if (!isInquiryCtaStyle(btn)) return;

        const row = btn.closest('.flex');
        const input = row?.querySelector<HTMLInputElement>('input');
        if (!input || btn.closest('form')) return;

        const handler = (e: Event) => {
          e.preventDefault();
          const value = input.value.trim();
          const isEmail = value.includes('@');
          goToInquiry({
            phone: isEmail ? undefined : value || undefined,
            email: isEmail ? value : undefined,
          });
        };

        btn.addEventListener('click', handler);
        btn.dataset.inquiryBound = 'true';
        cleanups.push(() => {
          btn.removeEventListener('click', handler);
          delete btn.dataset.inquiryBound;
        });
      });
    };

    const bindForms = () => {
      root.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
        if (form.dataset.inquiryForm === 'true') return;
        form.dataset.inquiryForm = 'true';

        const handler = (e: Event) => {
          e.preventDefault();
          const payload = readFormPayload(form);
          goToInquiry({
            name: payload.name || undefined,
            company: payload.company || undefined,
            phone: payload.phone || undefined,
            email: payload.email || undefined,
            message: payload.message || undefined,
          });
        };

        form.addEventListener('submit', handler);
        cleanups.push(() => {
          form.removeEventListener('submit', handler);
          delete form.dataset.inquiryForm;
        });

        form.querySelectorAll<HTMLButtonElement>('button[type="button"]').forEach((btn) => {
          if (!TRIGGER_RE.test(normalizeText(btn))) return;
          btn.type = 'submit';
        });
      });
    };

    const run = () => {
      bindForms();
      bindQuickWidgets();
      bindTriggers();
    };

    run();
    const t1 = setTimeout(run, 100);
    const t2 = setTimeout(run, 400);

    const observer = new MutationObserver(run);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [pathname, router]);

  return null;
}
