const CACHE_PREFIX = "deckory-present-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const INITIAL_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(INITIAL_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_REQUIRED_ASSETS") return;
  const replyPort = event.ports?.[0];
  const assets = Array.isArray(event.data.assets) ? event.data.assets : [];

  event.waitUntil(
    cacheRequiredAssets(assets)
      .then((result) => replyPort?.postMessage({ type: "DECKORY_CACHE_RESULT", ...result }))
      .catch(() => replyPort?.postMessage({ type: "DECKORY_CACHE_RESULT", ok: false, failed: assets }))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheRequiredAssets(assets) {
  const cache = await caches.open(CACHE_NAME);
  const failed = [];

  await Promise.all([...new Set(assets)].map(async (asset) => {
    try {
      const url = new URL(asset, self.location.origin);
      if (url.origin !== self.location.origin) {
        failed.push(asset);
        return;
      }
      const response = await fetch(url.href, { cache: "reload" });
      if (!response.ok) {
        failed.push(asset);
        return;
      }
      await cache.put(url.href, response.clone());
    } catch {
      failed.push(asset);
    }
  }));

  return { ok: failed.length === 0, failed, cacheName: CACHE_NAME };
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/"));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
