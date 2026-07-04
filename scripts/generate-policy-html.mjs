import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = fs.readFileSync(path.join(root, 'scripts/privacy-policy-text.txt'), 'utf8').replace(/\u00a0/g, ' ');
const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkify(s) {
  return esc(s).replace(/(https:\/\/[^\s<]+)/g, (raw) => {
    const clean = raw.replace(/[.,;:!?)]+$/g, '');
    return `<a class="policy-page__link" href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>`;
  });
}

const parts = [];
parts.push(`<main class="policy-page flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-40 md:pt-48 pb-32 z-10 relative">
<div class="policy-page__intro mb-12 max-w-4xl">
<h1 class="font-headline-lg-mobile md:font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface mb-4">Политика обработки персональных данных</h1>
<p class="font-body-md text-body-md text-on-surface-variant">ООО «ППО №3» (далее — Оператор). Актуальная версия документа размещена на сайте <a class="policy-page__link" href="/policy">povpro.ru/policy</a>.</p>
</div>
<div class="policy-page__sections grid grid-cols-1 gap-gutter">`);

let i = 0;
if (lines[0].toLowerCase().includes('политика')) i = 1;

while (i < lines.length) {
  const line = lines[i];

  if (/^6\. /.test(line)) {
    parts.push(renderSection6(lines, i));
    while (i < lines.length && !/^7\. /.test(lines[i])) i++;
    continue;
  }

  if (/^\d+\. /.test(line) && !/^\d+\.\d+\./.test(line)) {
    parts.push(`<section class="liquid-glass rounded-xl p-8 md:p-12">
<div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
<span class="material-symbols-outlined">gavel</span>
</div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">${esc(line.replace(/^\d+\.\s*/, ''))}</h2>
</div>
<div class="policy-page__body space-y-4">`);
    i++;
    while (i < lines.length && !(/^\d+\. /.test(lines[i]) && !/^\d+\.\d+\./.test(lines[i]))) {
      parts.push(renderBlock(lines[i]));
      i++;
    }
    parts.push('</div></section>');
    continue;
  }

  parts.push(renderBlock(line));
  i++;
}

parts.push('</div></main>');
fs.writeFileSync(path.join(root, 'web/content/policy.html'), parts.join('\n'), 'utf8');
console.log('Wrote web/content/policy.html');

function renderBlock(line) {
  if (/^\d+\.\d+\./.test(line)) {
    const [num, ...rest] = line.split(/\.\s+/);
    const nums = line.match(/^(\d+\.\d+)\./);
    const label = nums ? nums[1] + '.' : '';
    const body = line.replace(/^\d+\.\d+\.\s*/, '');
    return `<div class="policy-page__clause flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
<div class="font-mono-label text-primary font-bold w-14 pt-1 shrink-0">${esc(label)}</div>
<p class="font-body-md text-body-md text-on-surface-variant">${linkify(body)}</p>
</div>`;
  }
  if (line.startsWith('—')) {
    return `<div class="policy-page__bullet flex items-start gap-3 pl-4">
<span class="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">fiber_manual_record</span>
<p class="font-body-md text-body-md text-on-surface-variant">${linkify(line.replace(/^—\s*/, ''))}</p>
</div>`;
  }
  return `<p class="font-body-md text-body-md text-on-surface-variant">${linkify(line)}</p>`;
}

function renderSection6(lines, start) {
  let i = start + 1;
  const blocks = [];
  while (i < lines.length && !/^7\. /.test(lines[i])) {
    blocks.push(lines[i]);
    i++;
  }

  const tableRows = [];
  let mode = '';
  for (const b of blocks) {
    if (b === 'Цель обработки') mode = 'goal';
    else if (b === 'Персональные данные') mode = 'data';
    else if (b === 'Правовые основания') mode = 'legal';
    else if (b === 'Виды обработки персональных данных') mode = 'types';
    else if (mode === 'goal') tableRows.push({ section: 'goal', text: b });
    else if (mode === 'data') tableRows.push({ section: 'data', text: b });
    else if (mode === 'legal') tableRows.push({ section: 'legal', text: b });
    else if (mode === 'types') tableRows.push({ section: 'types', text: b });
    else blocks.push(b);
  }

  const goal = tableRows.filter((r) => r.section === 'goal').map((r) => r.text).join('<br>');
  const data = tableRows.filter((r) => r.section === 'data').map((r) => `<li>${esc(r.text)}</li>`).join('');
  const legal = tableRows.filter((r) => r.section === 'legal').map((r) => r.text).join(' ');
  const types = tableRows.filter((r) => r.section === 'types').map((r) => `<li>${esc(r.text)}</li>`).join('');

  return `<section class="liquid-glass rounded-xl p-8 md:p-12">
<div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
<span class="material-symbols-outlined">gavel</span>
</div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Цели обработки персональных данных</h2>
</div>
<div class="policy-page__table grid grid-cols-1 md:grid-cols-2 gap-4">
<div class="policy-page__table-cell rounded-xl bg-surface-container/30 border border-white/5 p-5">
<h3 class="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-3">Цель обработки</h3>
<p class="font-body-md text-body-md text-on-surface-variant">${linkify(goal)}</p>
</div>
<div class="policy-page__table-cell rounded-xl bg-surface-container/30 border border-white/5 p-5">
<h3 class="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-3">Персональные данные</h3>
<ul class="policy-page__list font-body-md text-body-md text-on-surface-variant space-y-1">${data}</ul>
</div>
<div class="policy-page__table-cell rounded-xl bg-surface-container/30 border border-white/5 p-5 md:col-span-2">
<h3 class="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-3">Правовые основания</h3>
<p class="font-body-md text-body-md text-on-surface-variant">${linkify(legal)}</p>
</div>
<div class="policy-page__table-cell rounded-xl bg-surface-container/30 border border-white/5 p-5 md:col-span-2">
<h3 class="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-3">Виды обработки персональных данных</h3>
<ul class="policy-page__list font-body-md text-body-md text-on-surface-variant space-y-1">${types}</ul>
</div>
</div>
</section>`;
}
