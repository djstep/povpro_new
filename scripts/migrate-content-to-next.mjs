/**
 * Собирает public/ (build-site) и извлекает main → web/content/{slug}.html
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const outDir = path.join(root, 'web', 'content');

console.log('Сборка статики для извлечения контента...');
execSync('node scripts/build-site.mjs', { cwd: root, stdio: 'inherit' });

const routes = {
  '': 'index.html',
  'frikcionnye-nakladki': 'index.html',
  'frikcionnye-nakladki/nashi-izdeliya': 'index.html',
  'frikcionnye-nakladki/tu': 'index.html',
  'mekhanicheskaya-obrabotka': 'index.html',
  'proizvodstvo_detalej': 'index.html',
  'proizvodstvo-press-form-i-shtampov': 'index.html',
  'izgotovlenie-valov': 'index.html',
  'izgotovlenie-shesteren-i-zubchatyh-koles': 'index.html',
  'zuboreznye-raboty': 'index.html',
  'shlifovalnye-raboty': 'index.html',
  'frezernye-raboty': 'index.html',
  'tokarnye-raboty': 'index.html',
  'koordinatno-rastochnye-raboty': 'index.html',
  'elektroerozionnye-raboty': 'index.html',
  'dolbezhnye-raboty': 'index.html',
  'irt': 'index.html',
  'metalloobrabotka': 'index.html',
  'mashiny-dlya-litya-pod-davleniem': 'index.html',
  'remont-mashin-dlya-litya-pod-davleniem': 'index.html',
  'termoobrabotka': 'index.html',
  'remont-kuznechno-pressovogo-oborudovaniya': 'index.html',
  'izgotovlenie-kalyanovs': 'index.html',
  'contacts': 'index.html',
  'otzyvy-o-ppo': 'index.html',
};

function extractMain(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return '';
  let body = bodyMatch[1];

  // Общая шапка сайта (из build-site)
  body = body.replace(/<style id="site-nav">[\s\S]*?<\/style>/i, '');
  body = body.replace(/<nav class="fixed top-0[\s\S]*?<\/nav>\s*/gi, '');
  body = body.replace(/<nav class="lg:hidden fixed bottom-0[\s\S]*?<\/nav>\s*/gi, '');
  body = body.replace(/<header class="fixed[\s\S]*?<\/header>\s*/gi, '');

  // Дубли из отдельных макетов Stitch (свой header/nav)
  body = body.replace(/<header class="bg-surface[\s\S]*?<\/header>\s*/gi, '');
  body = body.replace(/<nav class="bg-surface\/40[\s\S]*?<\/nav>\s*/gi, '');
  body = body.replace(/<nav class="bg-surface-container\/90[\s\S]*?<\/nav>\s*/gi, '');

  // Обёртка мехобработки: side nav + flex
  body = body.replace(/<!-- TopNavBar -->[\s\S]*?<!-- Main Content Canvas -->\s*/i, '');
  body = body.replace(/<div class="flex flex-1">\s*/i, '');
  body = body.replace(/<\/main>\s*<\/div>(\s*)$/i, '</main>$1');

  body = body.replace(/<footer[\s\S]*?<\/footer>\s*/gi, '');

  // Пути к картинкам и ссылкам
  body = body.replace(/\/\/assets\/img\//g, '/assets/img/');
  body = body.replace(/(\.\.\/)+assets\/img\//g, '/assets/img/');
  body = body.replace(/(?<![/"'])assets\/img\//g, '/assets/img/');
  body = body.replace(/url\('\/\/assets\//g, "url('/assets/");
  body = body.replace(/href="([^"]*\/index\.html)"/g, (_, p) => {
    const clean = p.replace(/^\.\//, '').replace(/\/index\.html$/, '').replace(/^\/+/, '');
    return clean ? `href="/${clean}"` : 'href="/"';
  });
  body = body.replace(/href="\.\/"/g, 'href="/"');
  body = body.replace(/href="\/index\.html"/g, 'href="/"');

  return body.trim();
}

fs.mkdirSync(outDir, { recursive: true });

for (const [slug, file] of Object.entries(routes)) {
  const htmlPath =
    slug === '' ? path.join(publicDir, file) : path.join(publicDir, slug, file);
  if (!fs.existsSync(htmlPath)) {
    console.warn('Skip (missing):', htmlPath);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const main = extractMain(html);
  const outFile = slug === '' ? 'home.html' : `${slug.replace(/\//g, '__')}.html`;
  fs.writeFileSync(path.join(outDir, outFile), main);
  console.log('OK', slug || '/', '→', outFile);
}

// Синхронизация картинок в Next
const srcAssets = path.join(publicDir, 'assets');
const destAssets = path.join(root, 'web', 'public', 'assets');
if (fs.existsSync(srcAssets)) {
  fs.cpSync(srcAssets, destAssets, { recursive: true });
  console.log('Assets → web/public/assets');
}

console.log('\nDone →', outDir);
