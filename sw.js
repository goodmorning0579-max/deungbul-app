// 등불 서비스 워커 — PWA 설치 지원 + 기본 오프라인 캐싱
// CACHE_NAME을 배포할 때마다 바꿔서(v1, v2...), 브라우저가 새 서비스 워커를 확실히 감지하고
// 이전 버전의 캐시된 파일(예전 desktop.html/mobile.html)을 정리하도록 강제함
const CACHE_NAME = "deungbul-v79";
// 본문 페이지(mobile.html, desktop.html)는 각각 약 16MB라서 설치할 때 둘 다 내려받지 않고,
// 사용자가 실제로 연 페이지만 아래 fetch 처리에서 처음 열 때 자동으로 저장합니다(모바일 데이터 절약).
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./manifest-desktop.json",
  "./deungbul-192.png",
  "./deungbul-512.png"
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
  // 브라우저 확장 프로그램(chrome-extension:// 등)이 자체적으로 발생시키는 요청은
  // 서비스 워커가 가로채거나 캐싱하지 않고 그대로 통과시킴 (캐시 API가 http/https만 지원하기 때문)
  if (!event.request.url.startsWith("http")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy).catch(() => {}); // cache.put은 Promise이므로 .catch()로 처리
        }).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
