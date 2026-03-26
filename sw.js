importScripts('./version.js');
// Define exactly what we want to cache
const APP_URL = './MatNela.html';

const OFFLINE_HTML = `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MatNela</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center;padding:2rem}@media(prefers-color-scheme:dark){body{background:#080c18;color:#e8f0ff}.t{color:#00ffff;text-shadow:0 0 14px rgba(0,255,255,.45),0 0 36px rgba(0,255,255,.15)}.d{background:rgba(0,255,255,.08);border-color:rgba(0,255,255,.2)}}@media(prefers-color-scheme:light){body{background:#f0f4ff;color:#0a0e2a}.t{color:#005fcc;text-shadow:0 0 14px rgba(0,95,204,.5),0 0 30px rgba(0,95,204,.15)}.d{background:rgba(0,95,204,.07);border-color:rgba(0,95,204,.2)}}.i{font-size:4rem;margin-bottom:1rem}.t{font-size:1.35rem;font-weight:700;letter-spacing:.06em;margin-bottom:1.2rem;font-family:system-ui,sans-serif}.d{border:1px solid;border-radius:12px;padding:1rem 1.5rem;max-width:300px}.cz{font-size:.95rem;line-height:1.6;margin-bottom:.9rem;opacity:.85}.en{font-size:.85rem;line-height:1.5;opacity:.55}</style></head><body><div><div class="i">🍎</div><div class="t">MatNela — Offline</div><div class="d"><p class="cz">Cache aplikace nebyla nalezena.<br>Připoj se k internetu a znovu otevři app.</p><p class="en">App cache not found.<br>Connect to the internet and reopen the app.</p></div></div></body></html>`;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_VERSION).then(cache => {
      // Force cache the HTML file on install
      return cache.add(APP_URL).catch(err => console.error('Failed to cache app:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => 
      Promise.all(ks.filter(k => k !== APP_VERSION).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(APP_URL).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(e.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const resClone = networkResponse.clone();
            caches.open(APP_VERSION).then(c => c.put(APP_URL, resClone));
          }
          return networkResponse;
        }).catch(() => {
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html;charset=utf-8" }
          });
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => {
      return r || fetch(e.request).catch(() => new Response('', { status: 404 }));
    })
  );
});
