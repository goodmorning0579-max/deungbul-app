// 등불 서비스 워커 — PWA 설치 지원 + 기본 오프라인 캐싱
const CACHE_NAME = "deungbul-v1";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./mobile.html",
  "./desktop.html",
  "./manifest.json",
  "./manifest-desktop.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // 일부 파일 실패해도 설치는 계속 진행
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 (본문 API는 항상 최신을 우선 시도)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, copy); } catch (e) {}
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
