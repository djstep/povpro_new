/**
 * Импорт листов Excel → таблицы на странице «Наши фрикционные изделия»
 * Листы 1–4: вкладыши ВП/ВУ/ВК и сектор; листы 5–12: доп. каталоги
 * Использование: node scripts/import-friction-tables.mjs [путь-к-xlsx]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const defaultXlsx = 'C:/Users/stepa/Downloads/Новая таблица.xlsx';
const contentFile = path.join(root, 'web', 'content', 'frikcionnye-nakladki__nashi-izdeliya.html');
const sourceFile = path.join(root, 'site', 'pages', 'products.html');

const BADGE_CLASS = 'bg-primary/20 text-primary';

const SECTIONS = [
  {
    title: 'Вкладыш фрикционный ВП',
    badge: 'ВП',
    note: 'Параметр B может быть любым, на заказ!',
  },
  {
    title: 'Вкладыш фрикционный ВУ',
    badge: 'ВУ',
    note: 'Параметр B может быть любым, на заказ!',
  },
  {
    title: 'Вкладыш фрикционный ВК',
    badge: 'ВК',
    note: 'Параметр B может быть любым, на заказ!',
  },
  {
    title: 'Сектор фрикционный BC',
    badge: 'BC',
    note: null,
  },
];

/** Листы 5–12: лист 5 — серия C; листы 6–12 — по артикулам */
const EXTRA_SECTIONS = [
  {
    sheetIndex: 4,
    title: 'Сектор фрикционный',
    badge: 'C',
    note: null,
  },
  {
    sheetIndex: 5,
    title: 'Сектор фрикционный Д-019',
    badge: 'Д-019',
    note: null,
  },
  {
    sheetIndex: 6,
    title: 'Сектор фрикционный H-001',
    badge: 'H-001',
    note: null,
  },
  {
    sheetIndex: 7,
    title: 'Фрикционная пластина',
    badge: 'Пластины',
    note: 'Параметр B может быть любым, на заказ!',
  },
  {
    sheetIndex: 8,
    title: 'Колодка фрикционная тормозная 4020.81.100-1 СБ для буровой лебедки ЛБУ 1200 К',
    badge: 'Тормозные',
    note: null,
    rowFilter: (row) => /Тормоз/i.test(String(row[row.length - 1] ?? '')),
  },
  {
    sheetIndex: 8,
    title: 'Вкладыш фрикционный Матрешка',
    badge: 'ВМ',
    note: null,
  },
  {
    sheetIndex: 9,
    title: 'Фрикционное кольцо',
    badge: 'Кольца',
    note: 'Параметр B может быть любым, на заказ!',
  },
  {
    sheetIndex: 10,
    title: 'Фрикционное кольцо коническое',
    badge: 'КК',
    note: null,
  },
  {
    sheetIndex: 11,
    title: 'Нестандартные фрикционные изделия',
    badge: 'НС',
    note: null,
  },
];

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCell(val, colIdx) {
  const text = val === '' || val == null ? '' : String(val);
  if (colIdx === 0) {
    return `<td class="py-3 px-4 text-on-surface-variant">${esc(text)}</td>`;
  }
  if (colIdx === 1 && text) {
    return `<td class="py-3 px-4 font-mono-label">${esc(text)}</td>`;
  }
  return `<td class="py-3 px-4">${esc(text)}</td>`;
}

function sheetToTable(rows, rowFilter) {
  if (!rows.length) return '';
  const [header, ...body] = rows;
  const filteredBody = rowFilter
    ? body.filter((row) => row.some((c) => c !== '' && c != null) && rowFilter(row, header))
    : body;
  const thead = header
    .map((h) => `<th class="py-3 px-4 font-semibold text-primary">${esc(h)}</th>`)
    .join('\n');

  const tbody = filteredBody
    .filter((row) => row.some((c) => c !== '' && c != null))
    .map((row) => {
      const cells = header.map((_, i) => formatCell(row[i], i)).join('\n');
      return `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors">\n${cells}\n</tr>`;
    })
    .join('\n');

  return `<table class="w-full text-left border-collapse whitespace-nowrap">
<thead>
<tr class="border-b border-white/10 font-label-sm text-label-sm uppercase tracking-wider">
${thead}
</tr>
</thead>
<tbody class="font-body-md text-body-md text-on-surface">
${tbody}
</tbody>
</table>`;
}

function buildSection(section, tableHtml) {
  const note = section.note
    ? `<p class="text-on-surface-variant font-label-sm mb-4">${section.note}</p>\n`
    : '';
  return `<!-- ${section.title} -->
<section class="glass-panel rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
<div class="bg-surface-container/50 px-6 py-5 border-b border-white/5 flex items-center justify-between">
<h2 class="font-headline-lg text-headline-lg text-on-surface font-headline-lg-mobile">${section.title}</h2>
<span class="${BADGE_CLASS} px-4 py-2 rounded-full font-mono-label text-mono-label">${section.badge}</span>
</div>
<div class="overflow-x-auto p-6">
${note}${tableHtml}
</div>
</section>`;
}

function main() {
  const xlsxPath = process.argv[2] || defaultXlsx;
  if (!fs.existsSync(xlsxPath)) {
    console.error('Файл не найден:', xlsxPath);
    process.exit(1);
  }
  if (!fs.existsSync(contentFile)) {
    console.error('Нет файла контента:', contentFile);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheetNames = wb.SheetNames;
  if (sheetNames.length < 4) {
    console.error('Нужно минимум 4 листа, найдено:', sheetNames.length);
    process.exit(1);
  }
  if (sheetNames.length < 12) {
    console.warn('Ожидалось 12 листов, найдено:', sheetNames.length);
  }

  const sectionsHtml = [];

  for (let i = 0; i < SECTIONS.length; i++) {
    const name = sheetNames[i];
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
    const rowCount = data.length - 1;
    console.log(`Лист ${i + 1} (${name}): ${rowCount} строк → ${SECTIONS[i].title}`);
    sectionsHtml.push(buildSection(SECTIONS[i], sheetToTable(data)));
  }

  for (const section of EXTRA_SECTIONS) {
    const name = sheetNames[section.sheetIndex];
    if (!name) {
      console.warn(`Пропуск (нет листа ${section.sheetIndex + 1}): ${section.title}`);
      continue;
    }
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
    const rowCount = (section.rowFilter
      ? data.slice(1).filter((row) => section.rowFilter(row, data[0]))
      : data.slice(1)
    ).length;
    console.log(`Лист ${section.sheetIndex + 1} (${name}): ${rowCount} строк → ${section.title}`);
    sectionsHtml.push(buildSection(section, sheetToTable(data, section.rowFilter)));
  }

  const tablesBlock = `<!-- Tables Section -->
<div class="flex flex-col gap-12">
${sectionsHtml.join('\n')}
</div>`;

  for (const file of [contentFile, sourceFile]) {
    if (!fs.existsSync(file)) {
      console.warn('Пропуск (нет файла):', file);
      continue;
    }
    let html = fs.readFileSync(file, 'utf8');
    const replaced = html.replace(
      /<!-- Tables Section -->[\s\S]*?(?=\s*<\/main>)/,
      tablesBlock + '\n'
    );
    if (replaced === html) {
      console.error('Не удалось найти блок таблиц в', file);
      process.exit(1);
    }
    fs.writeFileSync(file, replaced, 'utf8');
    console.log('OK →', file);
  }
}

main();
