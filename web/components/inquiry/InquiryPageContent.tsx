'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { submitInquiry } from '@/lib/inquiry-api';
import { OrderForm } from './OrderForm';

function splitLegacyContact(contact: string): { phone: string; email: string } {
  const trimmed = contact.trim();
  if (!trimmed) return { phone: '', email: '' };
  if (trimmed.includes('@')) return { phone: '', email: trimmed };
  return { phone: trimmed, email: '' };
}

export function InquiryPageContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? undefined;

  const initialContact = useMemo(() => {
    const phone = searchParams.get('phone') ?? '';
    const email = searchParams.get('email') ?? '';
    if (phone || email) return { phone, email };
    const legacy = searchParams.get('contact') ?? '';
    return splitLegacyContact(legacy);
  }, [searchParams]);

  const [name, setName] = useState(() => searchParams.get('name') ?? '');
  const [company, setCompany] = useState(() => searchParams.get('company') ?? '');
  const [phone, setPhone] = useState(() => initialContact.phone);
  const [email, setEmail] = useState(() => initialContact.email);
  const [message, setMessage] = useState(() => searchParams.get('message') ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  async function handleSubmit(e: React.FormEvent, files: File[]) {
    e.preventDefault();
    if (!name.trim()) {
      setStatus('error');
      setErrorText('Укажите имя');
      return;
    }
    if (!phone.trim()) {
      setStatus('error');
      setErrorText('Укажите телефон');
      return;
    }
    if (!email.trim()) {
      setStatus('error');
      setErrorText('Укажите email');
      return;
    }
    setStatus('loading');
    setErrorText('');

    const parts: string[] = [];
    if (company.trim()) parts.push(`Компания: ${company.trim()}`);
    if (message.trim()) parts.push(message.trim());
    if (files.length > 0) {
      parts.push(`Прикреплённые файлы: ${files.map((f) => f.name).join(', ')}`);
    }

    const result = await submitInquiry({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      message: parts.length > 0 ? parts.join('\n\n') : undefined,
      source: from ?? 'zakaz',
    });
    if (result.ok) {
      setStatus('success');
      return;
    }
    setStatus('error');
    setErrorText(result.error);
  }

  return (
    <div className="site-content font-body-md text-body-md w-full">
      <main className="pt-40 md:pt-48 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <section className="max-w-4xl mx-auto w-full" id="zakaz">
          <div className="mb-10 md:mb-12">
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-6">Сделать заказ</h1>
            <div className="space-y-4 font-body-md text-body-md text-on-surface-variant max-w-3xl">
              <p>
                Примем заказ на изготовление металлоизделий по чертежам, на обработку металла в кратчайшие сроки.
              </p>
              <p>
                Заполните форму для того, чтобы наши специалисты смогли сделать вам полный расчет стоимости продукции.
                Прикрепите чертежи, технические условия, сопроводительную документацию.
              </p>
            </div>
          </div>

          <div className="liquid-glass rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -inset-24 bg-gradient-to-tr from-primary/5 to-transparent opacity-50 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Заявка отправлена</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Специалист свяжется с вами в ближайшее время для уточнения деталей заказа.
                  </p>
                </div>
              ) : (
                <OrderForm
                  name={name}
                  company={company}
                  phone={phone}
                  email={email}
                  message={message}
                  onNameChange={setName}
                  onCompanyChange={setCompany}
                  onPhoneChange={setPhone}
                  onEmailChange={setEmail}
                  onMessageChange={setMessage}
                  onSubmit={handleSubmit}
                  loading={status === 'loading'}
                  error={status === 'error' ? errorText : undefined}
                  autoFocus
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
