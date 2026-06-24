/**
 * Конвертация растровых изображений в WebP рядом с оригиналами.
 * Оригиналы НЕ удаляются — это безопасно: при отсутствии .webp всё работает как раньше.
 * Запуск: npm run images:webp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let sharp;
try {
  // sharp установлен в web/node_modules — резолвим оттуда
  const requireFromWeb = createRequire(path.join(root, 'web', 'package.json'));
  sharp = requireFromWeb('sharp');
} catch {
  console.error('\n[webp] Не найден пакет sharp. Установите: npm i -D sharp --prefix web\n');
  process.exit(1);
}
const imgDir = path.join(root, 'web', 'public', 'assets', 'img');

const QUALITY = 80;
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(imgDir)) {
  console.error(`[webp] Нет каталога: ${imgDir}`);
  process.exit(1);
}

const files = walk(imgDir).filter((f) => SOURCE_EXT.has(path.extname(f).toLowerCase()));

let created = 0;
let skipped = 0;
let savedBytes = 0;

for (const file of files) {
  const webp = file.replace(/\.(png|jpe?g)$/i, '.webp');

  if (fs.existsSync(webp) && fs.statSync(webp).mtimeMs >= fs.statSync(file).mtimeMs) {
    skipped += 1;
    continue;
  }

  try {
    await sharp(file).webp({ quality: QUALITY, effort: 5 }).toFile(webp);
    const before = fs.statSync(file).size;
    const after = fs.statSync(webp).size;
    savedBytes += Math.max(0, before - after);
    created += 1;
    console.log(
      `[webp] ${path.relative(imgDir, file)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`,
    );
  } catch (e) {
    console.error(`[webp] Ошибка: ${file}`, e.message);
  }
}

console.log(
  `\n[webp] Готово. Создано: ${created}, пропущено: ${skipped}, экономия ~${(savedBytes / 1024 / 1024).toFixed(2)} МБ`,
);
