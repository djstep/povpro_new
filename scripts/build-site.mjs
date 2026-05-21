import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'site', 'pages');
const outDir = path.join(root, 'public');

const routes = {
  '/': 'index.html',
  '/frikcionnye-nakladki': 'friction-linings.html',
  '/frikcionnye-nakladki/nashi-izdeliya': 'products.html',
  '/frikcionnye-nakladki/tu': 'specs.html',
  '/mekhanicheskaya-obrabotka': 'machining.html',
  '/proizvodstvo_detalej': 'products.html',
  '/proizvodstvo-press-form-i-shtampov': 'machining.html',
  '/izgotovlenie-valov': 'machining.html',
  '/izgotovlenie-shesteren-i-zubchatyh-koles': 'machining.html',
  '/zuboreznye-raboty': 'machining.html',
  '/shlifovalnye-raboty': 'machining.html',
  '/frezernye-raboty': 'machining.html',
  '/tokarnye-raboty': 'machining.html',
  '/koordinatno-rastochnye-raboty': 'machining.html',
  '/elektroerozionnye-raboty': 'machining.html',
  '/dolbezhnye-raboty': 'machining.html',
  '/irt': 'intelligent-systems.html',
  '/metalloobrabotka': 'services.html',
  '/mashiny-dlya-litya-pod-davleniem': 'mld.html',
  '/remont-mashin-dlya-litya-pod-davleniem': 'mld.html',
  '/termoobrabotka': 'heat-treatment.html',
  '/remont-kuznechno-pressovogo-oborudovaniya': 'kpo.html',
  '/izgotovlenie-kalyanovs': 'hookahs.html',
  '/contacts': 'contacts.html',
  '/otzyvy-o-ppo': 'reviews.html',
};

const pageTitles = {
  '/': 'Главная',
  '/frikcionnye-nakladki': 'Фрикционные накладки',
  '/frikcionnye-nakladki/nashi-izdeliya': 'Наши фрикционные изделия',
  '/frikcionnye-nakladki/tu': 'Технические условия',
  '/mekhanicheskaya-obrabotka': 'Мехобработка',
  '/proizvodstvo_detalej': 'Продукция',
  '/proizvodstvo-press-form-i-shtampov': 'Штампы и пресс-формы',
  '/izgotovlenie-valov': 'Валы',
  '/izgotovlenie-shesteren-i-zubchatyh-koles': 'Шестерни и зубчатые колеса',
  '/zuboreznye-raboty': 'Зуборезные работы',
  '/shlifovalnye-raboty': 'Шлифовальные работы',
  '/frezernye-raboty': 'Фрезерные работы',
  '/tokarnye-raboty': 'Токарные работы',
  '/koordinatno-rastochnye-raboty': 'Координатно-расточные работы',
  '/elektroerozionnye-raboty': 'Электроэрозионные работы',
  '/dolbezhnye-raboty': 'Долбежные работы',
  '/irt': 'Интеллектуальные системы',
  '/metalloobrabotka': 'Услуги',
  '/mashiny-dlya-litya-pod-davleniem': 'Продажа МЛД',
  '/remont-mashin-dlya-litya-pod-davleniem': 'Ремонт МЛД',
  '/termoobrabotka': 'Термообработка',
  '/remont-kuznechno-pressovogo-oborudovaniya': 'Ремонт кузнечно-прессового оборудования',
  '/izgotovlenie-kalyanovs': 'Изготовление кальянов',
  '/contacts': 'Контакты',
  '/otzyvy-o-ppo': 'Отзывы',
};

const LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAbnb-_niYbXNu6FJEjkH0l8VPhQ8iKDkOGZd9_YrKB1hRg2LVyay3ME0FSzyjDB4BZ-SbmPPD8Rru1I0MPkcX-8YqUxyLaHw9Y77kay9bOZrA8HKFNa1zdcC4h-m9KOKv1fHk9auxlzkIGTSdqq4EWyg5ZEEQv83hTyk1qPQKqkdjR4O-O6l9mEq4Ug7I_cVJun8gyvJP0wenJUh8FpWwZXJZZQkRd8DgE90Jolic1QiSye2vfyIDaKOO0O3NEyTvKQYd15-qwerev';

function routeParts(route) {
  return route === '/' ? [] : route.split('/').filter(Boolean);
}

/** Relative link — works via локальный сервер и при открытии index.html из папки */
function relHref(fromRoute, toRoute) {
  if (fromRoute === toRoute) {
    return './index.html';
  }
  if (toRoute === '/') {
    const depth = routeParts(fromRoute).length;
    return depth === 0 ? './' : '../'.repeat(depth);
  }
  const from = routeParts(fromRoute);
  const to = routeParts(toRoute);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  const up = '../'.repeat(from.length - i);
  const down = to.slice(i).join('/');
  return up + down + '/index.html';
}

function assetHref(fromRoute, filename) {
  const depth = routeParts(fromRoute).length;
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return prefix + 'assets/img/' + filename;
}

const assetsDir = path.join(outDir, 'assets', 'img');
const imageCache = new Map();
const POVPRO_IMG = 'https://povpro.ru/views/resp_ppo/images';
const GALLERY_COUNT = 27;
let povproGalleryReady = false;

const GOOGLE_IMG_RE = /https:\/\/lh3\.googleusercontent\.com\/[^\s"'\\)]+/g;

function extractGoogleImageUrls(html) {
  return [...new Set(html.match(GOOGLE_IMG_RE) || [])];
}

function galleryFallbackName(url) {
  const digest = crypto.createHash('md5').update(url).digest();
  const idx = (digest[0] + digest[1] * 256) % GALLERY_COUNT;
  return `povpro-gallery-${idx + 1}.jpg`;
}

async function ensurePovproGallery() {
  if (povproGalleryReady) return;
  fs.mkdirSync(assetsDir, { recursive: true });

  const logoDest = path.join(assetsDir, 'povpro-logo.png');
  if (!fs.existsSync(logoDest)) {
    const res = await fetch(`${POVPRO_IMG}/logo.png`);
    if (res.ok) fs.writeFileSync(logoDest, Buffer.from(await res.arrayBuffer()));
  }

  for (let i = 1; i <= GALLERY_COUNT; i++) {
    const name = `povpro-gallery-${i}.jpg`;
    const dest = path.join(assetsDir, name);
    if (fs.existsSync(dest)) continue;
    const res = await fetch(`${POVPRO_IMG}/gallery-${i}.jpg`);
    if (res.ok) {
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    } else {
      console.warn('Gallery missing on povpro.ru:', i);
    }
  }

  povproGalleryReady = true;
}

async function downloadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);

  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 16);
  const tryPath = (ext) => path.join(assetsDir, hash + ext);

  for (const ext of ['.jpg', '.png', '.webp']) {
    if (fs.existsSync(tryPath(ext))) {
      const name = hash + ext;
      imageCache.set(url, name);
      return name;
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://stitch.withgoogle.com/',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(String(res.status));
    const ct = res.headers.get('content-type') || '';
    const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(tryPath(ext), buf);
    const name = hash + ext;
    imageCache.set(url, name);
    return name;
  } catch {
    const fallback = galleryFallbackName(url);
    if (fs.existsSync(path.join(assetsDir, fallback))) {
      imageCache.set(url, fallback);
      return fallback;
    }
    const placeholder = 'placeholder.svg';
    imageCache.set(url, placeholder);
    return placeholder;
  }
}

async function localizeImages(html, routePath) {
  await ensurePovproGallery();

  if (!fs.existsSync(path.join(assetsDir, 'placeholder.svg'))) {
    fs.writeFileSync(
      path.join(assetsDir, 'placeholder.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d1c2d"/><stop offset="100%" stop-color="#273647"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
    );
  }

  const urls = extractGoogleImageUrls(html);
  for (const url of urls) {
    const file = await downloadImage(url);
    html = html.split(url).join(assetHref(routePath, file));
  }

  return html;
}

function isActive(activePath, path, extraRe) {
  if (activePath === path || activePath.startsWith(path + '/')) return true;
  return extraRe ? extraRe.test(activePath) : false;
}

function getNavHtml(activePath) {
  const h = (to) => relHref(activePath, to);

  const lnk = (p, label) => {
    const active = isActive(activePath, p)
      ? 'text-primary font-bold border-b-2 border-primary pb-1'
      : 'text-on-surface-variant hover:text-on-surface';
    return `<a class="${active} transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap" href="${h(p)}">${label}</a>`;
  };

  const drop = (p, label, items, extraRe) => {
    const mainActive = isActive(activePath, p, extraRe)
      ? 'text-primary font-bold'
      : 'text-on-surface-variant hover:text-on-surface';
    const sub = items
      .map(([sp, sl]) => {
        const sa = activePath === sp ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary';
        return `<a class="block px-4 py-2 text-sm ${sa}" href="${h(sp)}">${sl}</a>`;
      })
      .join('');
    return `<div class="relative group shrink-0">
<a class="${mainActive} transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-1" href="${h(p)}">${label} <span class="material-symbols-outlined text-sm">expand_more</span></a>
<div class="absolute left-0 top-full pt-2 hidden group-hover:block min-w-[300px] z-[100] pointer-events-auto"><div class="liquid-glass rounded-lg py-2 border border-white/10 shadow-xl max-h-[70vh] overflow-y-auto">${sub}</div></div>
</div>`;
  };

  const friction = drop('/frikcionnye-nakladki', 'Фрикционные накладки', [
    ['/frikcionnye-nakladki/nashi-izdeliya', 'Наши фрикционные изделия'],
    ['/frikcionnye-nakladki/tu', 'Технические условия'],
  ]);

  const mech = drop(
    '/mekhanicheskaya-obrabotka',
    'Мехобработка',
    [
      ['/proizvodstvo_detalej', 'Продукция'],
      ['/proizvodstvo-press-form-i-shtampov', 'Штампы и пресс-формы'],
      ['/izgotovlenie-valov', 'Валы'],
      ['/izgotovlenie-shesteren-i-zubchatyh-koles', 'Шестерни и зубчатые колеса'],
      ['/zuboreznye-raboty', 'Зуборезные работы'],
      ['/shlifovalnye-raboty', 'Шлифовальные работы'],
      ['/frezernye-raboty', 'Фрезерные работы'],
      ['/tokarnye-raboty', 'Токарные работы'],
      ['/koordinatno-rastochnye-raboty', 'Координатно-расточные работы'],
      ['/elektroerozionnye-raboty', 'Электроэрозионные работы'],
      ['/dolbezhnye-raboty', 'Долбежные работы'],
    ],
    /^\/(mekhanicheskaya-obrabotka|proizvodstvo|izgotovlenie-|zuboreznye|shlifovalnye|frezernye|tokarnye|koordinatno|elektroerozionnye|dolbezhnye)/
  );

  const uslugi = drop(
    '/metalloobrabotka',
    'Услуги',
    [
      ['/mashiny-dlya-litya-pod-davleniem', 'Продажа МЛД'],
      ['/remont-mashin-dlya-litya-pod-davleniem', 'Ремонт МЛД'],
      ['/termoobrabotka', 'Термообработка'],
      ['/remont-kuznechno-pressovogo-oborudovaniya', 'Ремонт кузнечно-прессового оборудования'],
      ['/izgotovlenie-kalyanovs', 'Изготовление кальянов'],
    ],
    /^\/(metalloobrabotka|mashiny-dlya|remont-mashin|termoobrabotka|remont-kuznechno|izgotovlenie-kalyanov)/
  );

  const mobileUslugi = /^\/(metalloobrabotka|mashiny-dlya|remont-mashin|termoobrabotka|remont-kuznechno|izgotovlenie-kalyanov)/.test(activePath)
    ? 'text-primary'
    : 'text-on-surface-variant';
  const mobileMech = /^\/(mekhanicheskaya-obrabotka|proizvodstvo|izgotovlenie-|zuboreznye|shlifovalnye|frezernye|tokarnye|koordinatno|elektroerozionnye|dolbezhnye)/.test(activePath)
    ? 'text-primary'
    : 'text-on-surface-variant';
  const mobileHome = activePath === '/' ? 'text-primary' : 'text-on-surface-variant';
  const mobileContacts = activePath === '/contacts' ? 'text-primary' : 'text-on-surface-variant';

  return `<style id="site-nav">nav .group:hover>div.absolute{display:block!important}body>nav{overflow:visible}</style>
<nav class="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-3xl border-b border-white/10 flex flex-col overflow-visible">
<div class="border-b border-white/5">
<div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
<a href="${h('/')}" class="font-headline-lg-mobile text-primary font-black tracking-tighter text-[2.5rem] leading-tight flex items-center gap-4 no-underline">
<img alt="ППО №3" class="w-12 h-12 object-contain" src="${LOGO}">ППО №3
</a>
<div class="flex items-center gap-6">
<div class="hidden md:grid grid-cols-[auto_auto] gap-x-6 gap-y-0 items-center">
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-base">location_on</span><div class="text-on-surface-variant font-label-sm text-label-sm">г. Тольятти</div></div>
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-base">call</span><a class="text-on-surface hover:text-primary font-label-sm text-label-sm font-bold" href="tel:+78482555900">8 (8482) 555-900</a></div>
<div class="flex items-center gap-2 mt-1"><div class="w-4"></div><div class="text-on-surface-variant font-label-sm text-label-sm">ул. Окраинная, 24</div></div>
<div class="flex items-center gap-2 mt-1"><span class="material-symbols-outlined text-primary text-base">mail</span><a class="text-on-surface hover:text-primary font-label-sm text-label-sm font-bold" href="mailto:office@povpro.ru">office@povpro.ru</a></div>
</div>
<a href="${h('/contacts')}" class="bg-primary text-on-primary rounded-full px-5 py-3 font-label-sm text-label-sm hover:opacity-90 uppercase tracking-widest font-bold no-underline">Запросить расчет</a>
</div>
</div>
</div>
<div class="hidden lg:block border-t border-white/5">
<div class="max-w-container-max mx-auto px-margin-desktop py-3 flex justify-center">
<div class="flex items-center gap-4 xl:gap-6 flex-wrap justify-center">
${lnk('/', 'Главная')}
${friction}
${mech}
${lnk('/irt', 'Интеллектуальные системы')}
${uslugi}
${lnk('/contacts', 'Контакты')}
${lnk('/otzyvy-o-ppo', 'Отзывы')}
</div>
</div>
</div>
</nav>
<nav class="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface-container/80 backdrop-blur-2xl border-t border-white/10">
<a class="flex flex-col items-center px-3 py-1 ${mobileHome}" href="${h('/')}"><span class="material-symbols-outlined text-xl">home</span><span class="text-xs">Главная</span></a>
<a class="flex flex-col items-center px-3 py-1 ${mobileUslugi}" href="${h('/metalloobrabotka')}"><span class="material-symbols-outlined text-xl">settings</span><span class="text-xs">Услуги</span></a>
<a class="flex flex-col items-center px-3 py-1 ${mobileMech}" href="${h('/mekhanicheskaya-obrabotka')}"><span class="material-symbols-outlined text-xl">precision_manufacturing</span><span class="text-xs">Мехобработка</span></a>
<a class="flex flex-col items-center px-3 py-1 ${mobileContacts}" href="${h('/contacts')}"><span class="material-symbols-outlined text-xl">call</span><span class="text-xs">Контакты</span></a>
</nav>`;
}

function replaceSiteNav(html, routePath) {
  const nav = getNavHtml(routePath);
  html = html.replace(/<nav class="fixed top-0[\s\S]*?<\/nav>\s*(?:<!-- Bottom Navigation[\s\S]*?<\/nav>\s*)?/i, nav);
  html = html.replace(/<header class="fixed[\s\S]*?<\/header>/i, nav);
  return html;
}

function patchContentLinks(html, routePath) {
  if (routePath === '/frikcionnye-nakladki') {
    html = html.replace(
      /href="#">\s*<span class="material-symbols-outlined">call_log<\/span>\s*Наши фрикционные изделия/,
      `href="${relHref(routePath, '/frikcionnye-nakladki/nashi-izdeliya')}"><span class="material-symbols-outlined">call_log</span> Наши фрикционные изделия`
    );
    html = html.replace(
      /href="#">\s*<span class="material-symbols-outlined">description<\/span>\s*Технические условия/,
      `href="${relHref(routePath, '/frikcionnye-nakladki/tu')}"><span class="material-symbols-outlined">description</span> Технические условия`
    );
    html = html.replace(
      /href="#">ТУ 25-71-001-59647441-2005/,
      `href="${relHref(routePath, '/frikcionnye-nakladki/tu')}">ТУ 25-71-001-59647441-2005`
    );
  }
  return html;
}

function patchHtml(html, routePath, title) {
  html = replaceSiteNav(html, routePath);
  html = patchContentLinks(html, routePath);
  if (title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} — ППО №3</title>`);
  }

  const legacy = [
    ['index.html', '/'],
    ['friction-linings.html', '/frikcionnye-nakladki'],
    ['products.html', '/frikcionnye-nakladki/nashi-izdeliya'],
    ['specs.html', '/frikcionnye-nakladki/tu'],
    ['machining.html', '/mekhanicheskaya-obrabotka'],
    ['intelligent-systems.html', '/irt'],
    ['services.html', '/metalloobrabotka'],
    ['mld.html', '/mashiny-dlya-litya-pod-davleniem'],
    ['heat-treatment.html', '/termoobrabotka'],
    ['kpo.html', '/remont-kuznechno-pressovogo-oborudovaniya'],
    ['hookahs.html', '/izgotovlenie-kalyanovs'],
    ['contacts.html', '/contacts'],
    ['reviews.html', '/otzyvy-o-ppo'],
  ];
  for (const [file, route] of legacy) {
    html = html.split(`href="${file}"`).join(`href="${relHref(routePath, route)}"`);
  }

  const footer = [
    ['Главная', '/'],
    ['Фрикционные накладки', '/frikcionnye-nakladki'],
    ['Мехобработка', '/mekhanicheskaya-obrabotka'],
    ['Услуги', '/metalloobrabotka'],
    ['Технические условия', '/frikcionnye-nakladki/tu'],
    ['Наши изделия', '/frikcionnye-nakladki/nashi-izdeliya'],
    ['Отзывы', '/otzyvy-o-ppo'],
    ['Контакты', '/contacts'],
    ['Продукция', '/proizvodstvo_detalej'],
  ];
  for (const [text, route] of footer) {
    html = html.replaceAll(`href="#">${text}`, `href="${relHref(routePath, route)}">${text}`);
  }

  // Абсолютные ссылки из контента Stitch (только известные маршруты)
  for (const route of Object.keys(routes)) {
    if (route === '/') continue;
    const abs = `href="${route}/"`;
    const abs2 = `href="${route}"`;
    const rel = `href="${relHref(routePath, route)}"`;
    html = html.split(abs).join(rel);
    html = html.split(abs2).join(rel);
  }
  html = html.split('href="/"').join(`href="${relHref(routePath, '/')}"`);

  return html;
}

async function build() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  for (const [routePath, srcFile] of Object.entries(routes)) {
    const srcPath = path.join(srcDir, srcFile);
    if (!fs.existsSync(srcPath)) {
      console.warn('Missing:', srcFile);
      continue;
    }
    const destDir = routePath === '/' ? outDir : path.join(outDir, routePath.slice(1));
    fs.mkdirSync(destDir, { recursive: true });
    let html = fs.readFileSync(srcPath, 'utf8');
    html = patchHtml(html, routePath, pageTitles[routePath]);
    html = await localizeImages(html, routePath);
    fs.writeFileSync(path.join(destDir, 'index.html'), html);
    console.log('Built', routePath);
  }

  console.log(`\nDone: ${Object.keys(routes).length} pages -> ${outDir}`);
  const vals = [...imageCache.values()];
  console.log(
    `Images: ${imageCache.size} mapped (${vals.filter((v) => v.startsWith('povpro-gallery')).length} from povpro.ru, ${vals.filter((v) => v === 'placeholder.svg').length} placeholders)`
  );
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
