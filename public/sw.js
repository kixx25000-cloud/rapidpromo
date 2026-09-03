// Service worker minimal : rend le site installable (PWA) et met en cache
// les fichiers statiques pour un chargement plus rapide au retour.
// Les pages HTML (offres, prix) sont toujours redemandées au serveur pour
// rester à jour — on ne met en cache que les fichiers qui ne changent pas.

// v2 : le cache "cache d'abord" gardait indéfiniment l'ancienne version de
// style.css pour les visiteurs ayant déjà installé la PWA, même après une
// mise à jour du fichier sur le serveur (le service worker ne se réactive
// que si ce fichier sw.js change, pas quand /style.css change côté
// serveur). Le changement de nom vide le cache existant pour tout le monde,
// et la stratégie "stale-while-revalidate" ci-dessous (voir plus bas) évite
// que le problème ne se reproduise à chaque future mise à jour du CSS.
const CACHE_NAME = "rapidpromo-static-v2";
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

  // Fichiers statiques : "stale-while-revalidate" — sert immédiatement la
  // version en cache pour un chargement rapide, tout en redemandant la
  // dernière version au serveur en arrière-plan et en mettant le cache à
  // jour pour la prochaine visite. Contrairement à un simple "cache
  // d'abord", cela permet aux mises à jour du CSS de finir par arriver aux
  // visiteurs ayant installé la PWA, sans attendre un changement de sw.js.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          // event.waitUntil garde le service worker actif le temps que la
          // requête réseau se termine, même après avoir déjà répondu avec
          // la version en cache — sinon la mise à jour en arrière-plan
          // risquerait d'être interrompue.
          const fetchAndUpdate = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          event.waitUntil(fetchAndUpdate.catch(() => {}));
          return cached || fetchAndUpdate;
        })
      )
    );
  }
  // Tout le reste (pages, offres) : toujours le réseau, jamais de cache,
  // pour ne jamais montrer un prix ou une promo obsolète.
});
