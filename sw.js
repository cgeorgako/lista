const CACHE = 'lista-v18';
const ASSETS = [
  '/lista/',
  '/lista/index.html',
  '/lista/manifest.json',
  '/lista/icon-192.png',
  '/lista/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.filter(Boolean)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── Share Target: όταν ο χρήστης κάνει Share από τον browser ──
  // Το manifest δηλώνει action="/lista/share-recipe" με GET params.
  // Ο SW υποκλέπτει αυτό το request και ανακατευθύνει στο index.html
  // περνώντας το URL ως hash fragment (#share-recipe?url=...) ώστε
  // η σελίδα να το διαβάσει χωρίς server-side λογική.
  if (url.pathname === '/lista/share-recipe') {
    const sharedUrl   = url.searchParams.get('url')   || '';
    const sharedTitle = url.searchParams.get('title') || '';
    const sharedText  = url.searchParams.get('text')  || '';

    // Κτίζουμε το redirect URL προς index.html με τα δεδομένα στο hash
    const params = new URLSearchParams({ url: sharedUrl, title: sharedTitle, text: sharedText });
    const redirectUrl = '/lista/#share-recipe?' + params.toString();

    e.respondWith(Response.redirect(redirectUrl, 302));
    return;
  }

  // ── Κανονική λογική cache-first ──
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
