'use client';

import { useCallback, useRef, useState } from 'react';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { localizedPath } from '@/lib/i18n/locale';
import { formatRuPhoneInput } from '@/lib/phone';

const ACCEPT = '.pdf,.dwg,.docx,.zip,application/pdf,application/zip';
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const LABEL =
  'block font-label-sm text-label-sm text-on-surface uppercase tracking-wider mb-3 font-bold';

const INPUT_FIELD =
  'zakaz-field w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300';

const TEXTAREA_DARK =
  'zakaz-field w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-none min-h-[140px]';

function SubmitSendIcon() {
  return (
    <svg className="zakaz-submit-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

export type OrderFormValues = {
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
};

type OrderFormProps = OrderFormValues & {
  onNameChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent, files: File[]) => void;
  loading?: boolean;
  error?: string;
  autoFocus?: boolean;
};

/** Форма «Сделать заказ» — макет Google Stitch. */
export function OrderForm({
  name,
  company,
  phone,
  email,
  message,
  onNameChange,
  onCompanyChange,
  onPhoneChange,
  onEmailChange,
  onMessageChange,
  onSubmit,
  loading,
  error,
  autoFocus,
}: OrderFormProps) {
  const t = useT();
  const { locale } = useLocale();
  const policyHref = localizedPath('/policy', locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [personalDataAccepted, setPersonalDataAccepted] = useState(false);
  const [consentError, setConsentError] = useState('');

  const addFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setFileError('');
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${t.forms.attachFile}: «${file.name}» ${t.forms.fileTooLarge}`);
        continue;
      }
      next.push(file);
    }
    if (next.length) setFiles((prev) => [...prev, ...next]);
  }, [t.forms.fileTooLarge]);

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!privacyAccepted || !personalDataAccepted) {
      setConsentError(t.forms.consentError);
      return;
    }
    setConsentError('');
    onSubmit(e, files);
  }

  return (
    <form className="flex flex-col gap-8 font-body-md text-body-md" onSubmit={handleFormSubmit} noValidate>
      <p className="font-mono-label text-mono-label text-on-surface-variant/60">{t.forms.requiredFields}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <label className={LABEL} htmlFor="order-name">
            <span className="text-primary">*</span> {t.forms.name}
          </label>
          <input
            id="order-name"
            className={INPUT_FIELD}
            placeholder={t.forms.namePlaceholder}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus={autoFocus}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="order-company">
            {t.forms.company}
          </label>
          <input
            id="order-company"
            className={INPUT_FIELD}
            placeholder={t.forms.companyPlaceholder}
            type="text"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="order-phone">
            <span className="text-primary">*</span> {t.forms.phone}
          </label>
          <input
            id="order-phone"
            className={INPUT_FIELD}
            placeholder={t.forms.phonePlaceholder}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={18}
            value={phone}
            onChange={(e) => onPhoneChange(formatRuPhoneInput(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="order-email">
            <span className="text-primary">*</span> {t.forms.email}
          </label>
          <input
            id="order-email"
            className={INPUT_FIELD}
            placeholder={t.forms.emailPlaceholder}
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="order-message">
          {t.forms.orderComments}
        </label>
        <textarea
          id="order-message"
          className={TEXTAREA_DARK}
          placeholder={t.forms.messagePlaceholder}
          rows={5}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="order-files">
          {t.forms.attachFile}
        </label>
        <input
          ref={inputRef}
          id="order-files"
          type="file"
          className="sr-only"
          accept={ACCEPT}
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
        <div
          role="button"
          tabIndex={0}
          className={`zakaz-file-drop ${dragOver ? 'zakaz-file-drop--active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">cloud_upload</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface text-center mb-2">
            {t.forms.dropHint}
          </p>
          <p className="font-mono-label text-mono-label text-on-surface-variant/50 text-center">
            {t.forms.formatsHint}
          </p>
        </div>
        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-full bg-white/5 border border-white/10 px-4 py-2"
              >
                <span className="font-body-md text-body-md text-on-surface truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
                  aria-label={`${t.forms.removeFile} ${file.name}`}
                  onClick={() => removeFile(i)}
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {fileError && <p className="text-error text-sm font-body-md mt-2">{fileError}</p>}
      </div>

      {(error || consentError) && (
        <p className="text-error text-sm font-body-md">{error || consentError}</p>
      )}

      <div className="flex flex-col-reverse lg:flex-row lg:items-end lg:justify-between gap-6 pt-2">
        <div className="flex flex-col gap-4">
          <label className="zakaz-consent">
            <input
              type="checkbox"
              className="zakaz-consent-input"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked);
                if (e.target.checked && personalDataAccepted) setConsentError('');
              }}
            />
            <span className="zakaz-consent-text">
              {t.forms.consentPrivacy}{' '}
              <a className="zakaz-consent-link" href={policyHref} target="_blank" rel="noopener noreferrer">
                {t.forms.privacyLink}
              </a>
            </span>
          </label>
          <label className="zakaz-consent">
            <input
              type="checkbox"
              className="zakaz-consent-input"
              checked={personalDataAccepted}
              onChange={(e) => {
                setPersonalDataAccepted(e.target.checked);
                if (e.target.checked && privacyAccepted) setConsentError('');
              }}
            />
            <span className="zakaz-consent-text">
              {t.forms.consentPersonalData}{' '}
              <a className="zakaz-consent-link" href={policyHref} target="_blank" rel="noopener noreferrer">
                {t.forms.privacyLink}
              </a>
            </span>
          </label>
        </div>
        <button type="submit" className="zakaz-submit-btn shrink-0 self-end lg:self-auto" disabled={loading}>
          <span className="zakaz-submit-label">{t.forms.submitOrder}</span>
          <SubmitSendIcon />
        </button>
      </div>
    </form>
  );
}
