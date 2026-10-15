const CACHE='taif-guide-v2';
const ASSETS=['./index.html','./about.html','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./images/rose.jpg','./images/shubra.jpg','./images/kateb.jpg','./images/ibnabbas.jpg','./images/kou.jpg','./images/daka.jpg','./images/hada.jpg','./images/saysad.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))));});
