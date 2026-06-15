'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const LABEL =
  'block font-label-sm text-label-sm text-on-surface uppercase tracking-wider mb-3 font-bold';

const INPUT_FIELD =
  'zakaz-field w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300';

const TEXTAREA_DARK =
  'zakaz-field w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-none min-h-[160px]';

function SubmitSendIcon() {
  return (
    <svg className="zakaz-submit-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = 'image/*,.pdf';

type FileFieldProps = {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

function FileField({ id, label, file, onChange, error }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(list: FileList | null) {
    if (!list?.[0]) return;
    const picked = list[0];
    if (picked.size > MAX_FILE_BYTES) {
      onChange(null);
      return;
    }
    onChange(picked);
  }

  return (
    <div>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      <div className="review-file-row">
        <button
          type="button"
          className="review-file-btn"
          onClick={() => inputRef.current?.click()}
        >
          Выберите файл
        </button>
        <span className="review-file-name">{file ? file.name : 'Файл не выбран'}</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          accept={ACCEPT_IMAGES}
          onChange={(e) => pick(e.target.files)}
        />
      </div>
      {error && <p className="text-error text-sm font-body-md mt-2">{error}</p>}
    </div>
  );
}

function ReviewForm() {
  const [email, setEmail] = useState('');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!author.trim()) {
        setError('Укажите имя компании или физ. лица');
        return;
      }
      if (!text.trim()) {
        setError('Введите текст отзыва');
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Укажите корректный email');
        return;
      }

      const attachments: string[] = [];
      if (logoFile) attachments.push(`Логотип: ${logoFile.name}`);
      if (scanFile) attachments.push(`Скан отзыва: ${scanFile.name}`);

      setLoading(true);
      try {
        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim() || undefined,
            author: author.trim(),
            text: text.trim(),
            attachments,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Не удалось отправить отзыв');
          return;
        }
        setSuccess(true);
        setEmail('');
        setAuthor('');
        setText('');
        setLogoFile(null);
        setScanFile(null);
      } catch {
        setError('Ошибка сети. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    },
    [author, email, logoFile, scanFile, text],
  );

  if (success) {
    return (
      <div className="review-form-success liquid-glass rounded-[2rem] p-8 md:p-10 text-center">
        <span className="material-symbols-outlined text-primary text-5xl mb-4 block">check_circle</span>
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
          Спасибо за отзыв!
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Отзыв отправлен на модерацию и появится на сайте после проверки.
        </p>
      </div>
    );
  }

  return (
    <form
      className="review-form liquid-glass rounded-[2rem] p-8 md:p-10 flex flex-col gap-6"
      onSubmit={handleSubmit}
      noValidate
    >
      <div>
        <label className={LABEL} htmlFor="review-email">
          Ваш email (не публикуется)
        </label>
        <input
          id="review-email"
          className={INPUT_FIELD}
          type="email"
          placeholder="example@company.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="review-author">
          <span className="text-primary">*</span> Имя компании или физ. лица
        </label>
        <input
          id="review-author"
          className={INPUT_FIELD}
          type="text"
          placeholder="ООО «Пример» или Иван Иванов"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </div>

      <FileField id="review-logo" label="Логотип или фото" file={logoFile} onChange={setLogoFile} />

      <div>
        <label className={LABEL} htmlFor="review-text">
          <span className="text-primary">*</span> Текст отзыва
        </label>
        <textarea
          id="review-text"
          className={TEXTAREA_DARK}
          placeholder="Расскажите о вашем опыте работы с ППО №3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>

      <FileField id="review-scan" label="Скан отзыва" file={scanFile} onChange={setScanFile} />

      {error && <p className="text-error text-sm font-body-md">{error}</p>}

      <div className="pt-2">
        <button type="submit" className="zakaz-submit-btn shrink-0" disabled={loading}>
          <span className="zakaz-submit-label">{loading ? 'Отправка…' : 'Отправить'}</span>
          <SubmitSendIcon />
        </button>
      </div>
    </form>
  );
}

export function ReviewsPanel() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setAnchor(document.getElementById('reviews-form-anchor'));
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      if (v) setFormKey((k) => k + 1);
      return !v;
    });
  }

  if (!anchor) return null;

  return createPortal(
    <div className="reviews-panel w-full flex flex-col items-center">
      <button
        type="button"
        className="glass-button text-primary font-label-sm text-label-sm px-8 py-4 rounded-full uppercase tracking-widest hover:bg-white/10 transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-2 mb-6"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="review-form-panel"
      >
        <span className="material-symbols-outlined text-xl">
          {open ? 'close' : 'rate_review'}
        </span>
        {open ? 'Скрыть форму' : 'Добавить отзыв'}
      </button>

      {open && (
        <div id="review-form-panel" className="w-full max-w-2xl">
          <ReviewForm key={formKey} />
        </div>
      )}
    </div>,
    anchor,
  );
}
