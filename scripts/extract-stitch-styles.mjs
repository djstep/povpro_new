/**
 * Собирает уникальные <style> из site/pages → web/styles/stitch-components.css
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, 'site', 'pages');
const outFile = path.join(root, 'web', 'styles', 'stitch-components.css');

const blocks = new Set();

for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith('.html')) continue;
  const html = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    let css = m[1].trim();
    if (!css || css.includes('tailwind-config')) continue;
    css = css
      .replace(/@import\s+url\([^)]+\)\s*;?/gi, '')
      .replace(/\bbody\s*\{[^}]*\}/gi, '');
    if (css.trim()) blocks.add(css.trim());
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

const header = `/* Автогенерация: node scripts/extract-stitch-styles.mjs */\n/* Кастомные классы из макетов Google Stitch */\n\n`;

fs.writeFileSync(outFile, header + [...blocks].join('\n\n'));
console.log('Written', outFile, `(${blocks.size} blocks)`);
