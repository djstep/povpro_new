const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const backup = path.join('public', 'assets', 'img', 'povpro-loader.orig.gif');
const framesDir = path.join('public', 'assets', 'img', '_loader-frames');
const outWebp = path.join('public', 'assets', 'img', 'povpro-loader.webp');

/** Outer edge of ring ~198; keep white fill only inside, kill outer halo */
const CIRCLE_RADIUS = 196.5;

function isNearWhite(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max >= 230 && max - min <= 18;
}

/** Pale anti-alias fringe on the outer rim */
function isOuterFringe(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 200;
}

function clearOutsideCircle(data, w, h) {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r2 = CIRCLE_RADIUS * CIRCLE_RADIUS;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) continue;

      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isNearWhite(r, g, b) || isOuterFringe(r, g, b) || data[i + 3] < 10) {
        data[i + 3] = 0;
      }
    }
  }
}

(async () => {
  if (!fs.existsSync(backup)) {
    throw new Error('Missing povpro-loader.orig.gif');
  }

  fs.mkdirSync(framesDir, { recursive: true });
  for (const f of fs.readdirSync(framesDir)) {
    fs.unlinkSync(path.join(framesDir, f));
  }

  const meta = await sharp(backup, { animated: true }).metadata();
  const pages = meta.pages || 1;
  const delayMs = (meta.delay && meta.delay[0]) || 80;

  for (let p = 0; p < pages; p++) {
    const { data, info } = await sharp(backup, { pages: 1, page: p })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    clearOutsideCircle(buf, info.width, info.height);
    const file = path.join(framesDir, `f${String(p).padStart(3, '0')}.png`);
    await sharp(buf, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toFile(file);
    if (p % 12 === 0) console.log('frame', p + 1, '/', pages);
  }

  const fps = 1000 / delayMs;
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      path.join(framesDir, 'f%03d.png'),
      '-c:v',
      'libwebp',
      '-loop',
      '0',
      '-lossless',
      '1',
      '-compression_level',
      '4',
      outWebp,
    ],
    { stdio: 'inherit' },
  );

  for (const f of fs.readdirSync(framesDir)) {
    fs.unlinkSync(path.join(framesDir, f));
  }
  fs.rmdirSync(framesDir);

  const { data } = await sharp(outWebp, { pages: 1, page: 0 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  console.log('corner alpha', data[3], 'center', [...data.slice((200 * 400 + 200) * 4, (200 * 400 + 200) * 4 + 4)]);
  console.log('done', fs.statSync(outWebp).size);
})();
