// Service worker minimal : rend le site installable (PWA) et met en cache
// les fichiers statiques pour un chargement plus rapide au retour.
// Les pages HTML (offres, prix) sont toujours redemandées au serveur pour
// rester à jour — on ne met en cache que les fichiers qui ne changent pas.

const CACHE_NAME = "rapidpromo-static-v1";
const STATIC_ASSETS = ["/style.css", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Fichiers statiques : cache d'abord, réseau en secours.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Tout le reste (pages, offres) : toujours le réseau, jamais de cache,
  // pour ne jamais montrer un prix ou une promo obsolète.
});
