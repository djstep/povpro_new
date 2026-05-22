/**
 * Падает на сборке, если картинки не попали в web/public (типичная причина 404 на Vercel).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'web', 'public', 'assets', 'img');

const required = ['povpro-gallery-1.jpg', 'e345e1d85b71d21e.png'];

if (!fs.existsSync(imgDir)) {
  console.error(
    '\n[build] Нет web/public/assets/img/. Выполните: npm run migrate:content\n'
  );
  process.exit(1);
}

const files = fs.readdirSync(imgDir);
if (files.length < 10) {
  console.error(
    `\n[build] Слишком мало файлов в web/public/assets/img (${files.length}). Запустите migrate:content.\n`
  );
  process.exit(1);
}

for (const name of required) {
  if (!fs.existsSync(path.join(imgDir, name))) {
    console.error(`\n[build] Нет файла: ${name}\n`);
    process.exit(1);
  }
}

console.log(`[build] OK: ${files.length} images in web/public/assets/img`);
