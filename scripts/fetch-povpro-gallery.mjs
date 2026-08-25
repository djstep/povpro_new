#!/usr/bin/env node
/**
 * Скачивает gallery-1..27.jpg со старого shared (пока DNS уже на VPS, а файлы ещё там).
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'web', 'public', 'assets', 'img');
const LEGACY_HOST = process.env.LEGACY_GALLERY_HOST ?? '87.236.16.229';
const GALLERY_COUNT = 27;

fs.mkdirSync(OUT_DIR, { recursive: true });

function downloadGalleryFile(index) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: LEGACY_HOST,
        path: `/views/resp_ppo/images/gallery-${index}.jpg`,
        method: 'GET',
        headers: { Host: 'povpro.ru', 'User-Agent': 'povpro-gallery-fetch/1.0' },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve({ ok: false, status: res.statusCode ?? 0 });
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ ok: true, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.setTimeout(120_000, () => {
      req.destroy();
      resolve({ ok: false, status: 0 });
    });
    req.end();
  });
}

let ok = 0;
let skipped = 0;
let failed = 0;

for (let i = 1; i <= GALLERY_COUNT; i++) {
  const dest = path.join(OUT_DIR, `povpro-gallery-${i}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
    skipped++;
    continue;
  }

  const result = await downloadGalleryFile(i);
  if (!result.ok || !result.body) {
    console.warn(`✗ gallery-${i}.jpg — HTTP ${result.status}`);
    failed++;
    continue;
  }

  fs.writeFileSync(dest, result.body);
  console.log(`✓ povpro-gallery-${i}.jpg (${(result.body.length / 1024 / 1024).toFixed(1)} MB)`);
  ok++;
}

console.log(`Done: ${ok} downloaded, ${skipped} skipped, ${failed} failed → ${OUT_DIR}`);
