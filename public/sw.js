// SoccerAI Service Worker (PWA & Offline Cache)
const CACHE_NAME = 'soccerai-core-v1.5.0';
const API_CACHE_NAME = 'soccerai-api-v1.5.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Telepítés (Install): előtölti a kritikus fájlokat
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktiválás (Activate): eltakarítja az elavult cache verziókat
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('🧹 Régi Service Worker cache törlése:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Kérések kiszolgálása (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Csak GET kérések gyorsítótárazhatók
  if (request.method !== 'GET') {
    return;
  }

  // 1. API kérések (/api/matches, /api/apisports): Network-First gyorsítótár tartalékkal
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Ha nincs hálózat (offline), a legutóbbi sikeres API választ adjuk vissza
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('📡 Offline mód: API válasz kiszolgálva a gyorsítótárból:', request.url);
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({ error: 'Offline mód: Nincs internetkapcsolat és mentett adat' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 2. Statikus eszközök (JS, CSS, HTML, Képek, Fontok): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Navigációs kérés offline hibája esetén az index.html-t adjuk vissza
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
