// Инъекция в prerender-HTML при сборке web-образа:
//   1) GTM (скрипт в <head> как можно ближе к началу, noscript сразу после <body>)
//   2) дефолтный <title> (у статического prerender он пустой; на живых
//      переходах expo-router/head обновит его сам)
//
// GTM_ID берётся из --build-arg / ENV (GTM-TX5XXXX — своё значение).

import fs from 'node:fs';
import path from 'node:path';

const GTM_ID = process.env.GTM_ID;
const DIST = path.resolve(process.cwd(), 'dist');

if (!GTM_ID) {
  console.warn('[inject] GTM_ID не задан — GTM не встраивается');
  process.exit(0);
}

const WITH_TITLE = '<title data-rh="true">Расписание ЧРТ</title>';
const EMPTY_TITLE = '<title data-rh="true"></title>';

const gtmHead = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>`;

const gtmBody = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.html') || fs.statSync(path.join(DIST, f)).isDirectory());

let injected = 0;
for (const entry of files) {
  const file = path.join(DIST, entry);
  if (fs.statSync(file).isDirectory()) {
    // вложенные маршруты: dist/(peek)/peek.html и т.п.
    for (const inner of fs.readdirSync(file).filter((f) => f.endsWith('.html'))) {
      processFile(path.join(file, inner));
    }
    continue;
  }
  processFile(file);
}

function processFile(file) {
  let html = fs.readFileSync(file, 'utf8');

  // дефолтный title (если ещё не удаётся per-page)
  if (!/<title[^>]*>[^<]+</.test(html)) {
    html = html.replace(EMPTY_TITLE, WITH_TITLE);
  }

  // GTM: сразу после <head> … > (перед </title>-контентом, ближе к началу)
  html = html.replace(/<head>/, `<head>\n${gtmHead}`);
  // noscript: сразу после <body>
  html = html.replace(/<body>/, `<body>\n${gtmBody}`);

  fs.writeFileSync(file, html);
  injected += 1;
}

console.log(`[inject] GTM (${GTM_ID}) + title → ${injected} html файлов`);
