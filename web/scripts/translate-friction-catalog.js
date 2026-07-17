const fs = require('fs');
const path = require('path');

const srcPath = 'D:/povpro_new/web/content/frikcionnye-nakladki__nashi-izdeliya.html';
const outPath = 'D:/povpro_new/web/content/en/frikcionnye-nakladki__nashi-izdeliya.html';

let s = fs.readFileSync(srcPath, 'utf8');

const replacements = [
  ['Наши фрикционные изделия', 'Our friction products'],
  ['Фрикционные изделия (сектора, вкладыши, пластины, кольца), изготавливаются нашей компанией как по представленным размерам, так и по любым нестандартным по чертежу заказчика.',
   'Friction products (segments, inserts, plates, rings) are manufactured by our company to the dimensions shown here as well as to any non-standard sizes per customer drawings.'],
  ['placeholder="Поиск по маркировке (например, ВП 100-80-5)"', 'placeholder="Search by marking (e.g. VP 100-80-5)"'],
  ['>Найти<', '>Search<'],
  ['Параметр B может быть любым, на заказ!', 'Parameter B can be any value, custom order!'],
  ['Колодка фрикционная тормозная 4020.81.100-1 СБ для буровой лебедки ЛБУ 1200 К',
   'Friction brake pad 4020.81.100-1 SB for drilling winch LBU 1200 K'],
  ['Вкладыш фрикционный Матрешка', 'Friction insert Matryoshka'],
  ['Фрикционное кольцо коническое', 'Conical friction ring'],
  ['Фрикционное кольцо', 'Friction ring'],
  ['Фрикционная пластина', 'Friction plate'],
  ['Нестандартные фрикционные изделия', 'Custom friction products'],
  ['Сектор фрикционный Д-019', 'Friction segment D-019'],
  ['Сектор фрикционный H-001', 'Friction segment H-001'],
  ['Сектор фрикционный BC', 'Friction segment BC'],
  ['Сектор фрикционный', 'Friction segment'],
  ['Вкладыш фрикционный ВП', 'Friction insert VP'],
  ['Вкладыш фрикционный ВУ', 'Friction insert VU'],
  ['Вкладыш фрикционный ВК', 'Friction insert VK'],
  ['>Таблица размеров<', '>Dimensions table<'],
  ['>Угловые<', '>Angular<'],
  ['>Круглые<', '>Round<'],
  ['>Пластины<', '>Plates<'],
  ['>Тормозные<', '>Brake pads<'],
  ['>Кольца<', '>Rings<'],
  ['>Артикул<', '>Part No.<'],
  ['>Тип накладки (модель пресса)<', '>Lining type (press model)<'],
  ['>Угол<', '>Angle<'],
  ['>Длина<', '>Length<'],
  ['>Ширина<', '>Width<'],
  ['>А<', '>A<'],
  ['>В<', '>B<'],
  ['>С<', '>C<'],
  ['Схема вкладша ВП: параметры A, B, C', 'VP insert diagram: parameters A, B, C'],
  ['Схема вкладша ВУ: параметры A, B, C, R', 'VU insert diagram: parameters A, B, C, R'],
  ['Схема вкладша ВК: параметры D, B', 'VK insert diagram: parameters D, B'],
  ['Схема сектора BC: параметры A, R1, R2, B', 'BC segment diagram: parameters A, R1, R2, B'],
  ['Схема сектора: параметры D1, d2, B', 'Segment diagram: parameters D1, d2, B'],
  ['Схема сектора Д-019', 'Segment D-019 diagram'],
  ['Схема сектора H-001: параметры A, R1, R2, B', 'Segment H-001 diagram: parameters A, R1, R2, B'],
  ['Схема фрикционной пластины', 'Friction plate diagram'],
  ['Схема тормозной колодки', 'Brake pad diagram'],
  ['Схема вкладша Матрешка: параметры A, B, C, R1, R2', 'Matryoshka insert diagram: parameters A, B, C, R1, R2'],
  ['Схема фрикционного кольца: параметры D1, d2, B', 'Friction ring diagram: parameters D1, d2, B'],
  ['>на заказ<', '>custom order<'],
  ['Ножницы 1600 т.с. №2', 'Shears 1600 tf No. 2'],
  ['ГП 8336 24 11 (РШ 14 205) (С лыской)', 'GP 8336 24 11 (RSh 14 205) (with flat)'],
  ['К2160Б №049379 (С лыской)', 'K2160B No. 049379 (with flat)'],
  ['УД 1159 ( С буртиком )', 'UD 1159 (with flange)'],
  ['НТ 150600012 ( с отверстиями )', 'NT 150600012 (with holes)'],
  ['НТ 150600012 ( без отверстий )', 'NT 150600012 (without holes)'],
  ['Комацу200 (рулонница)', 'Komatsu 200 (coiler)'],
  ['Комацу200 (валковая подача)', 'Komatsu 200 (roll feed)'],
  ['лебёдка сычуань хун хуа JCO88-SM PЭ', 'Sichuan Honghua winch JCO88-SM PE'],
  ['PS 70-01.03A (Буровая лебедка JC50-1)', 'PS 70-01.03A (Drilling winch JC50-1)'],
  ['47 312 101 21 002 Innochenti-300 (Тормоз)', '47 312 101 21 002 Innochenti-300 (Brake)'],
  ['4-062-41-03-0116-1 Innochenti-300 (Тормоз)', '4-062-41-03-0116-1 Innochenti-300 (Brake)'],
  ['4-062-41-01-0103-1 Innochenti-300 (Тормоз)', '4-062-41-01-0103-1 Innochenti-300 (Brake)'],
  ['47 312 101 21 003 Innochenti-300 (Муфта)', '47 312 101 21 003 Innochenti-300 (Clutch)'],
  ['Муфта У3611', 'Clutch U3611'],
  ['Муфта КД 2330', 'Clutch KD 2330'],
  ['Пресс Эрфурт PEE1 400', 'Erfurt press PEE1 400'],
  ['Пресс печ U2000/4000 (UT57-6)', 'Press furnace U2000/4000 (UT57-6)'],
  ['Пресс 63 т.с (25-808-01)', 'Press 63 tf (25-808-01)'],
  ['Пресс К 8546, 4000 тн.', 'Press K 8546, 4000 t'],
  ['Пресс 40т т.с (УД 5-03-801-04)', 'Press 40 t tf (UD 5-03-801-04)'],
  ['Пресс РС 10М1', 'Press RS 10M1'],
  ['Эрфурт 250 тн (К274А 21М 801)', 'Erfurt 250 t (K274A 21M 801)'],
  ['УД 1303 пресс К2130 (47 311 101 21 001)', 'UD 1303 press K2130 (47 311 101 21 001)'],
  ['422 00097/Е 007 пресс РС 20М', '422 00097/E 007 press RS 20M'],
  ['422 00098/Е 009 пресс РС 20М', '422 00098/E 009 press RS 20M'],
  ['пресс Хатebur АМР-70 муфта', 'Hatebur AMR-70 press clutch'],
  ['пресс Хатebur АМР-70 тормоз', 'Hatebur AMR-70 press brake'],
];

// Sort by length descending to avoid partial overlaps
replacements.sort((a, b) => b[0].length - a[0].length);

for (const [from, to] of replacements) {
  if (s.includes(from)) s = s.split(from).join(to);
}

// Prefix/suffix word replacements for remaining descriptive press lines
const wordRules = [
  [/^пресс /, 'press '],
  [/^Пресс /, 'Press '],
  [/ пресс /g, ' press '],
  [/ Пресс /g, ' Press '],
  [/ пресс$/g, ' press'],
  [/ тормоз$/g, ' brake'],
  [/ муфта$/g, ' clutch'],
];

for (const [re, rep] of wordRules) {
  s = s.replace(/(<td class="py-3 px-4">)([^<]*)(<\/td>)/g, (full, pre, text, post) => {
    if (!/[\u0400-\u04FF]/.test(text)) return full;
    let t = text;
    if (re.global) {
      t = t.replace(re, rep);
    } else {
      t = t.replace(re, rep);
    }
    return pre + t + post;
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, s, 'utf8');

const lines = s.split(/\r?\n/).length;
console.log('Written:', outPath);
console.log('Lines:', lines);

const cyr = [...new Set(s.match(/[\u0400-\u04FF]+/g) || [])].sort((a, b) => b.length - a.length);
console.log('Remaining Cyrillic tokens:', cyr.length);
console.log(cyr.slice(0, 40).join('\n'));