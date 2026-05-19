# Build static site: Stitch pages + povpro.ru navigation structure
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

$srcDir = Join-Path $root 'site\pages'
$outDir = Join-Path $root 'site\dist'
if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# povpro.ru route -> source file in site/pages
$routes = [ordered]@{
    '/'                                      = 'index.html'
    '/frikcionnye-nakladki'                  = 'friction-linings.html'
    '/frikcionnye-nakladki/nashi-izdeliya'  = 'products.html'
    '/frikcionnye-nakladki/tu'               = 'specs.html'
    '/mekhanicheskaya-obrabotka'             = 'machining.html'
    '/proizvodstvo_detalej'                  = 'products.html'
    '/proizvodstvo-press-form-i-shtampov'    = 'machining.html'
    '/izgotovlenie-valov'                    = 'machining.html'
    '/izgotovlenie-shesteren-i-zubchatyh-koles' = 'machining.html'
    '/zuboreznye-raboty'                     = 'machining.html'
    '/shlifovalnye-raboty'                   = 'machining.html'
    '/frezernye-raboty'                      = 'machining.html'
    '/tokarnye-raboty'                       = 'machining.html'
    '/koordinatno-rastochnye-raboty'         = 'machining.html'
    '/elektroerozionnye-raboty'              = 'machining.html'
    '/dolbezhnye-raboty'                     = 'machining.html'
    '/irt'                                   = 'intelligent-systems.html'
    '/metalloobrabotka'                      = 'services.html'
    '/mashiny-dlya-litya-pod-davleniem'      = 'mld.html'
    '/remont-mashin-dlya-litya-pod-davleniem'= 'mld.html'
    '/termoobrabotka'                        = 'heat-treatment.html'
    '/remont-kuznechno-pressovogo-oborudovaniya' = 'kpo.html'
    '/izgotovlenie-kalyanovs'                = 'hookahs.html'
    '/contacts'                              = 'contacts.html'
    '/otzyvy-o-ppo'                          = 'reviews.html'
}

$pageTitles = @{
    '/' = 'Главная'
    '/frikcionnye-nakladki' = 'Фрикционные накладки'
    '/frikcionnye-nakladki/nashi-izdeliya' = 'Наши фрикционные изделия'
    '/frikcionnye-nakladki/tu' = 'Технические условия'
    '/mekhanicheskaya-obrabotka' = 'Мехобработка'
    '/proizvodstvo_detalej' = 'Продукция'
    '/proizvodstvo-press-form-i-shtampov' = 'Штампы и пресс-формы'
    '/izgotovlenie-valov' = 'Валы'
    '/izgotovlenie-shesteren-i-zubchatyh-koles' = 'Шестерни и зубчатые колеса'
    '/zuboreznye-raboty' = 'Зуборезные работы'
    '/shlifovalnye-raboty' = 'Шлифовальные работы'
    '/frezernye-raboty' = 'Фрезерные работы'
    '/tokarnye-raboty' = 'Токарные работы'
    '/koordinatno-rastochnye-raboty' = 'Координатно-расточные работы'
    '/elektroerozionnye-raboty' = 'Электроэрозионные работы'
    '/dolbezhnye-raboty' = 'Долбежные работы'
    '/irt' = 'Интеллектуальные системы'
    '/metalloobrabotka' = 'Услуги'
    '/mashiny-dlya-litya-pod-davleniem' = 'Продажа МЛД'
    '/remont-mashin-dlya-litya-pod-davleniem' = 'Ремонт МЛД'
    '/termoobrabotka' = 'Термообработка'
    '/remont-kuznechno-pressovogo-oborudovaniya' = 'Ремонт кузнечно-прессового оборудования'
    '/izgotovlenie-kalyanovs' = 'Изготовление кальянов'
    '/contacts' = 'Контакты'
    '/otzyvy-o-ppo' = 'Отзывы'
}

function Get-NavHtml([string]$activePath) {
    function Lnk([string]$path, [string]$label, [string]$cls = '') {
        $active = if ($activePath -eq $path -or ($path -ne '/' -and $activePath.StartsWith($path))) { 'text-primary font-bold border-b-2 border-primary pb-1' } else { 'text-on-surface-variant hover:text-on-surface' }
        $href = if ($path -eq '/') { '/' } else { "$path/" }
        return "<a class=`"$active transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap $cls`" href=`"$href`">$label</a>"
    }
    function Drop([string]$path, [string]$label, [string[]]$items, [string]$alsoActive = '') {
        $isActive = ($activePath -eq $path) -or $activePath.StartsWith("$path/")
        if ($alsoActive -and $activePath -match $alsoActive) { $isActive = $true }
        $mainActive = if ($isActive) { 'text-primary font-bold' } else { 'text-on-surface-variant hover:text-on-surface' }
        $href = "$path/"
        $sub = ($items | ForEach-Object {
            $parts = $_ -split '\|', 2
            $p = $parts[0]; $l = $parts[1]
            $subActive = if ($activePath -eq $p) { 'text-primary font-semibold' } else { 'text-on-surface-variant hover:text-primary' }
            $subHref = if ($p -eq '/') { '/' } else { "$p/" }
            "<a class=`"block px-4 py-2 text-sm $subActive`" href=`"$subHref`">$l</a>"
        }) -join ''
        return @"
<div class="relative group">
<a class="$mainActive transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-1" href="$href">$label <span class="material-symbols-outlined text-sm">expand_more</span></a>
<div class="absolute left-0 top-full pt-1 hidden group-hover:block min-w-[280px] z-[60]">
<div class="liquid-glass rounded-lg py-2 border border-white/10 shadow-xl">$sub</div>
</div>
</div>
"@
    }

    $friction = Drop '/frikcionnye-nakladki' 'Фрикционные накладки' @(
        '/frikcionnye-nakladki/nashi-izdeliya|Наши фрикционные изделия'
        '/frikcionnye-nakladki/tu|Технические условия'
    )
    $mech = Drop '/mekhanicheskaya-obrabotka' 'Мехобработка' @(
        '/proizvodstvo_detalej|Продукция'
        '/proizvodstvo-press-form-i-shtampov|Штампы и пресс-формы'
        '/izgotovlenie-valov|Валы'
        '/izgotovlenie-shesteren-i-zubchatyh-koles|Шестерни и зубчатые колеса'
        '/zuboreznye-raboty|Зуборезные работы'
        '/shlifovalnye-raboty|Шлифовальные работы'
        '/frezernye-raboty|Фрезерные работы'
        '/tokarnye-raboty|Токарные работы'
        '/koordinatno-rastochnye-raboty|Координатно-расточные работы'
        '/elektroerozionnye-raboty|Электроэрозионные работы'
        '/dolbezhnye-raboty|Долбежные работы'
    ) '^/(mekhanicheskaya-obrabotka|proizvodstvo|izgotovlenie-|zuboreznye|shlifovalnye|frezernye|tokarnye|koordinatno|elektroerozionnye|dolbezhnye)'
    $uslugi = Drop '/metalloobrabotka' 'Услуги' @(
        '/mashiny-dlya-litya-pod-davleniem|Продажа МЛД'
        '/remont-mashin-dlya-litya-pod-davleniem|Ремонт МЛД'
        '/termoobrabotka|Термообработка'
        '/remont-kuznechno-pressovogo-oborudovaniya|Ремонт кузнечно-прессового оборудования'
        '/izgotovlenie-kalyanovs|Изготовление кальянов'
    ) '^/(metalloobrabotka|mashiny-dlya|remont-mashin|termoobrabotka|remont-kuznechno|izgotovlenie-kalyanov)'

    $desktop = @(
        (Lnk '/' 'Главная')
        $friction
        $mech
        (Lnk '/irt' 'Интеллектуальные системы')
        $uslugi
        (Lnk '/contacts' 'Контакты')
        (Lnk '/otzyvy-o-ppo' 'Отзывы')
    ) -join "`n"

    return @"
<nav class="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-3xl border-b border-white/10 flex flex-col">
<div class="border-b border-white/5">
<div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
<a href="/" class="font-headline-lg-mobile text-primary font-black tracking-tighter text-[2.5rem] leading-tight flex items-center gap-4 no-underline">
<img alt="ППО №3" class="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbnb-_niYbXNu6FJEjkH0l8VPhQ8iKDkOGZd9_YrKB1hRg2LVyay3ME0FSzyjDB4BZ-SbmPPD8Rru1I0MPkcX-8YqUxyLaHw9Y77kay9bOZrA8HKFNa1zdcC4h-m9KOKv1fHk9auxlzkIGTSdqq4EWyg5ZEEQv83hTyk1qPQKqkdjR4O-O6l9mEq4Ug7I_cVJun8gyvJP0wenJUh8FpWwZXJZZQkRd8DgE90Jolic1QiSye2vfyIDaKOO0O3NEyTvKQYd15-qwerev">ППО №3
</a>
<div class="flex items-center gap-6">
<div class="hidden md:grid grid-cols-[auto_auto] gap-x-6 gap-y-0 items-center">
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-base">location_on</span><div class="text-on-surface-variant font-label-sm text-label-sm leading-[1.2]">г. Тольятти</div></div>
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-base">call</span><a class="text-on-surface hover:text-primary transition-colors font-label-sm text-label-sm font-bold" href="tel:+78482555900">8 (8482) 555-900</a></div>
<div class="flex items-center gap-2 mt-1"><div class="w-4"></div><div class="text-on-surface-variant font-label-sm text-label-sm">ул. Окраинная, 24</div></div>
<div class="flex items-center gap-2 mt-1"><span class="material-symbols-outlined text-primary text-base">mail</span><a class="text-on-surface hover:text-primary transition-colors font-label-sm text-label-sm font-bold" href="mailto:office@povpro.ru">office@povpro.ru</a></div>
</div>
<a href="/contacts/" class="bg-primary text-on-primary rounded-full px-5 py-3 font-label-sm text-label-sm hover:opacity-90 uppercase tracking-widest font-bold no-underline">Запросить расчет</a>
</div>
</div>
</div>
<div class="hidden lg:block border-t border-white/5">
<div class="max-w-container-max mx-auto px-margin-desktop py-3 flex justify-center">
<div class="flex items-center gap-4 xl:gap-6 flex-wrap justify-center">$desktop</div>
</div>
</div>
</nav>
<nav class="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface-container/80 backdrop-blur-2xl border-t border-white/10">
<a class="flex flex-col items-center px-3 py-1 $(if($activePath -eq '/'){'text-primary'}else{'text-on-surface-variant'})" href="/"><span class="material-symbols-outlined text-xl">home</span><span class="text-xs">Главная</span></a>
<a class="flex flex-col items-center px-3 py-1 $(if($activePath.StartsWith('/metalloobrabotka') -or $activePath -match 'mld|termoobrabotka|kpo|kalyanov'){'text-primary'}else{'text-on-surface-variant'})" href="/metalloobrabotka/"><span class="material-symbols-outlined text-xl">settings</span><span class="text-xs">Услуги</span></a>
<a class="flex flex-col items-center px-3 py-1 $(if($activePath.StartsWith('/mekhanicheskaya') -or $activePath -match 'proizvodstvo|izgotovlenie|raboty'){'text-primary'}else{'text-on-surface-variant'})" href="/mekhanicheskaya-obrabotka/"><span class="material-symbols-outlined text-xl">precision_manufacturing</span><span class="text-xs">Мехобработка</span></a>
<a class="flex flex-col items-center px-3 py-1 $(if($activePath -eq '/contacts'){'text-primary'}else{'text-on-surface-variant'})" href="/contacts/"><span class="material-symbols-outlined text-xl">call</span><span class="text-xs">Контакты</span></a>
</nav>
"@
}

function Patch-Html([string]$html, [string]$routePath, [string]$title) {
    $nav = Get-NavHtml $routePath
    # Replace both nav blocks (top + old mobile)
    $html = [regex]::Replace($html, '<nav class="fixed top-0[\s\S]*?</nav>\s*<!-- Bottom Navigation[\s\S]*?</nav>', $nav, 1)
    if (-not $html.Contains('fixed top-0 left-0 w-full z-50 bg-surface/80')) {
        $html = [regex]::Replace($html, '<nav class="fixed top-0[\s\S]*?</nav>', $nav, 1)
    }
    # Page title
    if ($title) {
        $html = [regex]::Replace($html, '<title>[^<]*</title>', "<title>$title — ППО №3</title>", 1)
    }
    # Root-absolute internal links (legacy flat names)
    $replacements = @{
        'href="index.html"' = 'href="/"'
        'href="friction-linings.html"' = 'href="/frikcionnye-nakladki/"'
        'href="products.html"' = 'href="/frikcionnye-nakladki/nashi-izdeliya/"'
        'href="specs.html"' = 'href="/frikcionnye-nakladki/tu/"'
        'href="machining.html"' = 'href="/mekhanicheskaya-obrabotka/"'
        'href="intelligent-systems.html"' = 'href="/irt/"'
        'href="services.html"' = 'href="/metalloobrabotka/"'
        'href="mld.html"' = 'href="/mashiny-dlya-litya-pod-davleniem/"'
        'href="heat-treatment.html"' = 'href="/termoobrabotka/"'
        'href="kpo.html"' = 'href="/remont-kuznechno-pressovogo-oborudovaniya/"'
        'href="hookahs.html"' = 'href="/izgotovlenie-kalyanovs/"'
        'href="contacts.html"' = 'href="/contacts/"'
        'href="reviews.html"' = 'href="/otzyvy-o-ppo/"'
    }
    foreach ($k in $replacements.Keys) { $html = $html.Replace($k, $replacements[$k]) }
    # Footer link text -> absolute
    foreach ($pair in @(
        @('Главная','/'), @('Фрикционные накладки','/frikcionnye-nakladki/'),
        @('Мехобработка','/mekhanicheskaya-obrabotka/'), @('Услуги','/metalloobrabotka/'),
        @('Технические условия','/frikcionnye-nakladki/tu/'), @('Наши изделия','/frikcionnye-nakladki/nashi-izdeliya/'),
        @('Отзывы','/otzyvy-o-ppo/'), @('Контакты','/contacts/'),
        @('Продукция','/proizvodstvo_detalej/')
    )) {
        $html = [regex]::Replace($html, "href=`"#`">$($pair[0])", "href=`"$($pair[1])`">$($pair[0])")
    }
    return $html
}

foreach ($entry in $routes.GetEnumerator()) {
    $routePath = $entry.Key
    $srcFile = $entry.Value
    $srcPath = Join-Path $srcDir $srcFile
    if (-not (Test-Path $srcPath)) { Write-Warning "Missing source: $srcFile"; continue }

    $destDir = if ($routePath -eq '/') { $outDir } else { Join-Path $outDir $routePath.TrimStart('/').Replace('/', '\') }
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    $destFile = Join-Path $destDir 'index.html'

    $html = [IO.File]::ReadAllText($srcPath)
    $title = $pageTitles[$routePath]
    $html = Patch-Html $html $routePath $title
    [IO.File]::WriteAllText($destFile, $html)
    Write-Host "Built $routePath -> $destFile"
}

# serve config
@'
{
  "cleanUrls": false,
  "trailingSlash": true,
  "redirects": [
    { "source": "/pages/:path*", "destination": "/", "type": 301 }
  ]
}
'@ | Set-Content (Join-Path $outDir 'serve.json') -Encoding utf8

Write-Host "`nBuilt $($routes.Count) routes to $outDir"
