const CACHE='taif-guide-v1';
const ASSETS=['./index.html','./manifest.webmanifest','./icon.svg','./images/rose.jpg','./images/shubra.jpg','./images/kateb.jpg','./images/ibnabbas.jpg','./images/kou.jpg','./images/daka.jpg','./images/hada.jpg','./images/saysad.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))));});
