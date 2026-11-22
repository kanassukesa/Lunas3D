// Service worker do Órbita Final.
// - Arquivos de /assets/ têm o nome com a versão (hash): ficam guardados no aparelho de vez (cache primeiro).
//   Se a internet falhar no meio, tenta de novo antes de desistir.
// - O resto (index.html, ícones) vai na rede primeiro, para sempre pegar a versão nova.
const CACHE = "orbita-final-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function buscarComRetentativa(req, tentativas = 3) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(req);
      if (res.ok || i >= tentativas - 1) return res;
    } catch (err) {
      if (i >= tentativas - 1) throw err;
    }
    await esperar(600 * (i + 1));
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.searchParams.has("verificar")) return; // checagem de versão nova: sempre direto na rede, sem guardar

  if (url.pathname.includes("/assets/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await buscarComRetentativa(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  e.respondWith(
    buscarComRetentativa(req, 2)
      .then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error())),
  );
});
