/* ============================================================
   이모티콘 스튜디오 AI Pro — 독립 도메인(emoticon-studio-pro) 전용 SW
   · 관제탑(stock-dashboard-live)의 sw.js 와는 오리진이 달라 캐시·스코프가 분리된다.
   · 규칙: 화면(HTML)은 네트워크 우선(항상 최신), 실패하면 캐시된 셸.
           API 는 다른 오리진(관제탑)이라 애초에 가로채지 않는다.
   · 오프라인 셸: 화면 + 매니페스트 + 아이콘만 담는다.
   ============================================================ */
const PREFIX = 'emoticon-studio-pro-';
const VERSION = PREFIX + 'v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/emoticon-192.png',
  '/icons/emoticon-512.png',
  '/icons/emoticon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // 관제탑 API·외부 CDN 은 브라우저에 그대로 맡긴다
  if (url.pathname.startsWith('/api/')) return;         // 같은 오리진 API 가 생겨도 항상 실시간 통과

  // 화면: 네트워크 우선 → 실패 시 캐시 셸
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(VERSION);
        cache.put('/index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cached) return cached;
        return new Response('오프라인 상태입니다. 네트워크에 연결한 뒤 다시 열어 주세요.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })());
    return;
  }

  // 나머지 정적 파일: 캐시 우선(stale-while-revalidate)
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
