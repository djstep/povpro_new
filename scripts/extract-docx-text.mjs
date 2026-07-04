import fs from 'fs';
import { inflateRawSync } from 'node:zlib';

const docxPath = process.argv[2];
if (!docxPath) {
  console.error('Usage: node extract-docx-text.mjs <file.docx>');
  process.exit(1);
}

const buf = fs.readFileSync(docxPath);
const entries = readZip(buf);
const xml = entries.get('word/document.xml');
if (!xml) {
  console.error('No word/document.xml in docx');
  process.exit(1);
}

const text = xml
  .toString('utf8')
  .replace(/<w:tab[^>]*\/>/g, '\t')
  .replace(/<w:br[^>]*\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/\r/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

console.log(text);

if (process.argv[3]) {
  fs.writeFileSync(process.argv[3], text, 'utf8');
}

function readZip(buffer) {
  const map = new Map();
  let offset = 0;
  while (offset < buffer.length - 30) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compMethod = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    let data = buffer.subarray(dataStart, dataStart + compSize);
    if (compMethod === 0) {
      map.set(name, data);
    } else if (compMethod === 8) {
      data = inflateRawSync(data);
      map.set(name, data);
    }
    offset = dataStart + compSize;
  }
  return map;
}
