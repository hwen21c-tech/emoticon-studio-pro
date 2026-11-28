/* ============================================================
   이모티콘 스튜디오 AI Pro — GitHub Pages 하위 경로(hwen21c-tech.github.io/<repo>/) 대응 SW
   · 관제탑(stock-dashboard-live) API 는 오리진이 달라 캐시·스코프가 물리적으로 분리된다.
   · BASE 는 SW 자신의 위치에서 계산한다 — 저장소 하위 경로 배포에서도 그대로 동작.
   · 규칙: 화면(HTML)은 네트워크 우선(항상 최신), 실패하면 캐시된 셸.
           API·외부 CDN 은 가로채지 않는다.
   · 오프라인 셸: 화면 + 매니페스트 + 아이콘만 담는다.
   ============================================================ */
const PREFIX = 'emoticon-studio-pro-';
const VERSION = PREFIX + 'v7';
const BASE = new URL('./', self.location).pathname;   // 예: /shorts-studio-pro/
const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/emoticon-192.png',
  BASE + 'icons/emoticon-512.png',
  BASE + 'icons/emoticon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // 하나가 실패해도 나머지는 담는다(첫 설치가 통째로 깨지지 않게)
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
  if (url.origin !== self.location.origin) return;        // 관제탑 API·외부 CDN 은 브라우저에 그대로 맡긴다
  if (!url.pathname.startsWith(BASE)) return;             // 이 앱의 범위 밖은 건드리지 않는다
  if (url.pathname.startsWith(BASE + 'api/')) return;     // 같은 오리진 API 가 생겨도 항상 실시간 통과

  // 편집기 화면: 네트워크 우선 → 실패 시 캐시 셸
  if (req.mode === 'navigate' || url.pathname === BASE || url.pathname === BASE + 'index.html') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(VERSION);
        cache.put(BASE + 'index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = (await caches.match(BASE + 'index.html')) || (await caches.match(BASE));
        if (cached) return cached;
        return new Response('오프라인 상태입니다. 네트워크에 연결한 뒤 다시 열어 주세요.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })());
    return;
  }

  // 나머지 정적 파일: 네트워크 우선 → 실패(오프라인) 시 캐시
  //   캐시 우선이면 index.html만 새것이고 app.js는 옛것이 섞여 화면 수치와 프리셋 개수가 어긋나는 사고가 난다.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (_) {
      const cached = await cache.match(req);
      if (cached) return cached;
      return Response.error();
    }
  })());
});
