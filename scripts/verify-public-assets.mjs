/**
 * Проверка PNG/логотипов перед сборкой (галерея грузится с povpro.ru).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'web', 'public', 'assets', 'img');

const required = ['e345e1d85b71d21e.png', 'placeholder.svg'];

if (!fs.existsSync(imgDir)) {
  console.error('\n[build] Нет web/public/assets/img/. Запустите: npm run migrate:content\n');
  process.exit(1);
}

const files = fs.readdirSync(imgDir);
const pngCount = files.filter((f) => f.endsWith('.png')).length;

if (pngCount < 5) {
  console.error(`\n[build] Мало PNG в web/public/assets/img (${pngCount}). Запустите migrate:content.\n`);
  process.exit(1);
}

for (const name of required) {
  if (!fs.existsSync(path.join(imgDir, name))) {
    console.error(`\n[build] Нет файла: ${name}\n`);
    process.exit(1);
  }
}

console.log(`[build] OK: ${files.length} files in web/public/assets/img`);
