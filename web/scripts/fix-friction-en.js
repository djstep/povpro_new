const fs = require('fs');
const outPath = 'D:/povpro_new/web/content/en/frikcionnye-nakladki__nashi-izdeliya.html';
let s = fs.readFileSync(outPath, 'utf8');
const fixes = [
  ['пресс Хатебур АМР-70 муфта', 'Hatebur AMR-70 press clutch'],
  ['пресс Хатебур АМР-70 тормоз', 'Hatebur AMR-70 press brake'],
  ['пресс Фичеп 1600', 'Ficep press 1600'],
  ['\n                 Найти\n', '\n                 Search\n'],
];
for (const [a,b] of fixes) s = s.split(a).join(b);
fs.writeFileSync(outPath, s, 'utf8');
console.log('fixed, lines', s.split(/\r?\n/).length);
console.log('Nayti left', s.includes('Найти'));
console.log('Hatebur left', (s.match(/Хатебур/g)||[]).length);
