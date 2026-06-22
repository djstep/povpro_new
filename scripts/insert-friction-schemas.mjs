import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'web', 'content', 'frikcionnye-nakladki__nashi-izdeliya.html');

/** Порядок секций = порядок картинок (11 схем). Без схем: коническое кольцо, нестандартные. */
const SCHEMAS = [
  { marker: '<!-- Вкладыш фрикционный ВП -->', file: 'friction-vp.png', alt: 'Схема вкладша ВП: параметры A, B, C' },
  { marker: '<!-- Вкладыш фрикционный ВУ -->', file: 'friction-vu.png', alt: 'Схема вкладша ВУ: параметры A, B, C, R' },
  { marker: '<!-- Вкладыш фрикционный ВК -->', file: 'friction-vk.png', alt: 'Схема вкладша ВК: параметры D, B' },
  { marker: '<!-- Сектор фрикционный BC -->', file: 'friction-bc.png', alt: 'Схема сектора BC: параметры A, R1, R2, B' },
  { marker: '<!-- Сектор фрикционный -->', file: 'friction-sector-d.png', alt: 'Схема сектора: параметры D1, d2, B' },
  { marker: '<!-- Сектор фрикционный Д-019 -->', file: 'friction-d019.png', alt: 'Схема сектора Д-019' },
  { marker: '<!-- Сектор фрикционный H-001 -->', file: 'friction-h001.png', alt: 'Схема сектора H-001: параметры A, R1, R2, B' },
  { marker: '<!-- Фрикционная пластина -->', file: 'friction-plate.png', alt: 'Схема фрикционной пластины' },
  { marker: '<!-- Колодка фрикционная тормозная 4020.81.100-1 СБ для буровой лебедки ЛБУ 1200 К -->', file: 'friction-brake-pad.png', alt: 'Схема тормозной колодки' },
  { marker: '<!-- Вкладыш фрикционный Матрешка -->', file: 'friction-matreshka.png', alt: 'Схема вкладша Матрешка: параметры A, B, C, R1, R2' },
  { marker: '<!-- Фрикционное кольцо -->', file: 'friction-ring.png', alt: 'Схема фрикционного кольца: параметры D1, d2, B' },
];

function schemaBlock({ file, alt }) {
  return `<div class="friction-table-schema">
<img src="/assets/img/friction/${file}" alt="${alt}" class="friction-table-schema__img" loading="lazy" width="640" height="200">
</div>
`;
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Удаляем ранее вставленные схемы
html = html.replace(/\n<div class="friction-table-schema">[\s\S]*?<\/div>\n/g, '\n');

for (const schema of SCHEMAS) {
  const markerIdx = html.indexOf(schema.marker);
  if (markerIdx < 0) {
    console.warn('Marker not found:', schema.marker);
    continue;
  }

  const sectionStart = html.indexOf('<section class="glass-panel', markerIdx);
  const wrapperStart = html.indexOf('<div class="overflow-x-auto p-6">', sectionStart);
  if (wrapperStart < 0) continue;

  const wrapperContentStart = wrapperStart + '<div class="overflow-x-auto p-6">'.length;
  const slice = html.slice(wrapperContentStart, wrapperContentStart + 800);
  if (slice.includes('friction-table-schema')) {
    console.log('Skip (already has schema):', schema.file);
    continue;
  }

  const tableIdx = html.indexOf('<table', wrapperContentStart);
  if (tableIdx < 0) continue;

  const noteMatch = html.slice(wrapperContentStart, tableIdx).match(/<p class="text-on-surface-variant[^"]*"[^>]*>[\s\S]*?<\/p>\s*/);
  const insertAt = noteMatch ? wrapperContentStart + noteMatch.index + noteMatch[0].length : tableIdx;

  html = html.slice(0, insertAt) + schemaBlock(schema) + html.slice(insertAt);
  console.log('Inserted:', schema.file);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Done');
