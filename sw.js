// Offline support: keep a copy of every file so SayMath works with no signal.
const VERSION = 'saymath-v2';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg',
  'src/parser.js', 'src/speak.js', 'src/render.js', 'src/explorer.js', 'src/evaluate.js',
  'src/problems.js', 'src/practice.js', 'src/teacher.js', 'src/ui.js', 'src/settings.js',
  'src/worksheet.js', 'src/worksheet-runtime.js', 'src/lang/en.js', 'src/lang/hi.js', 'src/lang/mr.js', 'src/i18n.js', 'src/braille.js', 'src/download.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for our own files (so updates arrive), cache when offline.
// Fonts: cache first, since they never change.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isFont = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (isFont) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => new Response('', { status: 404 }))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
