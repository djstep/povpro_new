import fs from 'fs';
import sharp from 'sharp';

const input = process.argv[2];
const output = process.argv[3] ?? input.replace(/\.(png|jpe?g)$/i, '-transparent.png');

if (!input) {
  console.error('Usage: node fix-icon-background.mjs <input> [output.png]');
  process.exit(1);
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const total = width * height;
const visited = new Uint8Array(total);
const transparent = new Uint8Array(total);

function idx(x, y) {
  return y * width + x;
}

function pixelAt(i) {
  return {
    r: data[i * 4],
    g: data[i * 4 + 1],
    b: data[i * 4 + 2],
  };
}

function isSimilar(a, b, tolerance = 42) {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance
  );
}

function isBackgroundSeed(p) {
  const avg = (p.r + p.g + p.b) / 3;
  const spread = Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b);
  if (avg > 150 && spread < 55) return true;
  if (avg < 40 && spread < 30) return true;
  return false;
}

const queue = [];

for (let x = 0; x < width; x++) {
  queue.push(idx(x, 0), idx(x, height - 1));
}
for (let y = 0; y < height; y++) {
  queue.push(idx(0, y), idx(width - 1, y));
}

while (queue.length) {
  const current = queue.pop();
  if (visited[current]) continue;
  visited[current] = 1;

  const p = pixelAt(current);
  if (!isBackgroundSeed(p)) continue;

  transparent[current] = 1;

  const x = current % width;
  const y = (current - x) / width;
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const ni = idx(nx, ny);
    if (visited[ni]) continue;
    if (isSimilar(p, pixelAt(ni))) queue.push(ni);
  }
}

for (let i = 0; i < total; i++) {
  const o = i * 4;
  const p = pixelAt(i);
  const avg = (p.r + p.g + p.b) / 3;

  if (transparent[i] || avg < 40) {
    data[o + 3] = 0;
    continue;
  }

  if (p.b > 90 && p.b >= p.g - 15 && p.g >= p.r - 25) {
    data[o] = 173;
    data[o + 1] = 198;
    data[o + 2] = 255;
    data[o + 3] = 255;
  } else {
    data[o + 3] = 0;
  }
}

await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(output);
console.log(`Wrote ${output} (${width}x${height})`);
