/**
 * Загружает выделенные (видимые) экраны Stitch для раздела «Мехобработка».
 * API-ключ: STITCH_API_KEY или ~/.cursor/mcp.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pagesDir = path.join(root, 'site', 'pages');
const PROJECT_ID = 'projects/14494823803936085508';
const MCP_URL = 'https://stitch.googleapis.com/mcp';

/** Порядок важен: более специфичные паттерны выше */
const MATCHERS = [
  { re: /^Изготовление кальянов/i, file: 'hookahs.html', priority: 20 },
  // Раздел «Продукция» (мехобработка)
  { re: /^Изготовление деталей/i, file: 'proizvodstvo-detalej.html', priority: 10 },
  { re: /^Изготовление штампов/i, file: 'press-forms.html', priority: 10 },
  { re: /^Изготовление валов/i, file: 'valy.html', priority: 10 },
  { re: /^Изготовление шестер/i, file: 'shesteren.html', priority: 10 },
  // Остальная мехобработка
  { re: /^Мехобработка/i, file: 'machining.html', priority: 5 },
  { re: /^Наши изделия/i, file: 'products.html', priority: 5 },
  { re: /^Долбежные/i, file: 'dolbezhnye-raboty.html', priority: 5 },
  { re: /^Шлифовальные.*Тех/i, file: 'shlifovalnye-raboty.html', priority: 10 },
  { re: /^Шлифовальные/i, file: 'shlifovalnye-raboty.html', priority: 1 },
  { re: /^Токарные/i, file: 'tokarnye-raboty.html', priority: 5 },
  { re: /^Электроэрозионные/i, file: 'elektroerozionnye-raboty.html', priority: 5 },
  { re: /^Фрезерные/i, file: 'frezernye-raboty.html', priority: 5 },
  { re: /^Координатно-расточные/i, file: 'koordinatno-rastochnye-raboty.html', priority: 5 },
  { re: /^Зуборезные.*Final/i, file: 'zuboreznye-raboty.html', priority: 10 },
  { re: /^Зуборезные/i, file: 'zuboreznye-raboty.html', priority: 5 },
];

function getApiKey() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  const mcpPath = path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    '.cursor',
    'mcp.json'
  );
  if (!fs.existsSync(mcpPath)) {
    throw new Error('Нет STITCH_API_KEY и ~/.cursor/mcp.json');
  }
  const cfg = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  return cfg.mcpServers.stitch.headers['X-Goog-Api-Key'];
}

async function mcpCall(tool, args) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: tool, arguments: args },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result?.structuredContent;
}

function matchTitle(title) {
  for (const m of MATCHERS) {
    if (m.re.test(title)) return m;
  }
  return null;
}

async function main() {
  fs.mkdirSync(pagesDir, { recursive: true });

  const data = await mcpCall('list_screens', { project_id: PROJECT_ID });
  const screens = data?.screens ?? [];
  console.log(`Экранов в проекте: ${screens.length}\n`);

  /** file -> { priority, title } */
  const chosen = new Map();

  for (const screen of screens) {
    const title = screen.title || '';
    const matcher = matchTitle(title);
    if (!matcher) continue;

    const url = screen.htmlCode?.downloadUrl;
    if (!url) {
      console.warn('Нет HTML:', title);
      continue;
    }

    const prev = chosen.get(matcher.file);
    if (prev && prev.priority > matcher.priority) {
      console.log(`Пропуск (есть новее): ${title}`);
      continue;
    }

    console.log(`→ ${matcher.file}: ${title}`);
    const htmlRes = await fetch(url);
    if (!htmlRes.ok) throw new Error(`HTTP ${htmlRes.status}: ${title}`);
    const html = await htmlRes.text();
    fs.writeFileSync(path.join(pagesDir, matcher.file), html, 'utf8');
    chosen.set(matcher.file, { priority: matcher.priority, title });
  }

  console.log('\nСохранено:');
  for (const [file, meta] of chosen) {
    console.log(`  ${file} ← ${meta.title}`);
  }

  if (!chosen.has('machining.html')) {
    console.warn('\nВнимание: экран «Мехобработка» не найден — machining.html не обновлён.');
  }

  console.log('\nДальше: npm run migrate:content && npm run styles:extract');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
