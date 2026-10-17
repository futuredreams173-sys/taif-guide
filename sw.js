/* مرشد الطائف — عامل الخدمة (مبني على مكتبة Workbox الرسمية) | Taif Guide — Service Worker (official Workbox runtime)
   الغرض: عمل التطبيق كاملاً دون اتصال، مع إبقاء الصفحات حديثة عند توفر الشبكة.
   Purpose: full offline use, while pages stay fresh whenever the network is available.

   الاستراتيجيات | Strategies
   1) الصفحات: الشبكة أولاً، وعند انقطاعها تُقدَّم نسخة الصفحة المخزَّنة.
      Pages: network-first, falling back to that same page's cached copy.
   2) الخطوط الخارجية: التخزين أولاً ليعمل التطبيق دون اتصال بشكل كامل.
      Web fonts: cache-first, so the app is fully usable offline.
   3) الملفات ذات الأسماء المتغيّرة (بصمة في الاسم): التخزين أولاً.
      Versioned / hashed assets: cache-first.
   4) بقية ملفات الموقع وصفحاته: تخزين مسبق كامل يعمل من أول تثبيت.
      The rest of the app: fully precached, offline from the very first install.

   لا يتدخل العامل إطلاقاً في | never handled at all
   - مسارات تسجيل الدخول وOAuth (أو نطاقاتها الخارجية).  login / OAuth paths and their origins.
   - الطلبات غير GET، ولا أي نطاق خارجي غير الخطوط.       non-GET requests, or any foreign origin but fonts.
*/
importScripts('./workbox/workbox-sw.js');

/* نُثبّت مسار المكتبة المحلية ونجبر نسخة الإنتاج (لا dev) ليعمل الاختبار على localhost أيضاً
   Lock the local module path and force the production build (no dev build, so localhost works too) */
workbox.setConfig({ modulePathPrefix: './workbox', debug: false });

/* مهم: ارفع REV عند تغيير أي ملف مخزَّن مسبقاً (صفحة أو صورة) حتى يُعاد تحميله
   Important: bump REV whenever a precached file (page or image) changes, so it is re-fetched */
const REV = 'v11';
const PAGE_CACHE = 'taif-pages-' + REV;        /* نسخ الصفحات للشبكة-أولاً | network-first page copies */
const FONT_CACHE = 'taif-fonts-' + REV;        /* الخطوط | web fonts */
const VERSIONED_CACHE = 'taif-versioned-' + REV; /* الملفات ذات الأسماء المتغيّرة | hashed assets */
const ASSET_CACHE = 'taif-assets-' + REV;      /* بقية ملفات الموقع | other same-origin files */
const IMAGE_CACHE = 'taif-images-' + REV;      /* الصور الخارجية (ويكيميديا) | external images */

/* مسارات تُستثنى: تسجيل الدخول وOAuth | excluded: login & OAuth */
const BYPASS = /\/(?:login|log-in|sign-?in|logout|log-out|sign-?out|auth|oauth|authorize|callback|sso|session|account)(?:[/?#]|$)/i;

/* نطاقات الخطوط | font hosts */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ملفات أسماؤها متغيّرة (بصمة/إصدار داخل الاسم) | file names carrying a hash/version stamp */
const VERSIONED = /\.[0-9a-f]{8,}\.(?:js|css|woff2?|ttf|eot|png|jpe?g|svg|webp|avif)$/i;

const PAGES = ['index.html', 'overview.html', 'tour.html', 'booking.html', 'restaurants.html',
  'about.html', 'places.html', 'nature.html', 'seasons.html', 'distill.html'];

const ASSETS = ['manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'install-prompt.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'images/rose.jpg', 'images/shubra.jpg', 'images/kateb.jpg', 'images/ibnabbas.jpg',
  'images/kou.jpg', 'images/daka.jpg', 'images/hada.jpg', 'images/saysad.jpg'];

const sameOrigin = url => url.origin === self.location.origin;
const cacheable = new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] });

/* عند فشل الخادم (خطأ 5xx) نُقدّم النسخة المخزَّنة بدل صفحة خطأ
   On a 5xx from the server, serve the cached copy instead of an error page */
const serveCacheWhenServerFails = {
  fetchDidSucceed: async ({ request, response }) => {
    if (response.status >= 500) {
      const cached = (await caches.match(request, { ignoreSearch: true }));
      if (cached) return cached;
    }
    return response;
  }
};

/* 1) الصفحات: الشبكة أولاً | pages: network-first */
workbox.routing.registerRoute(
  ({ request, url }) => request.mode === 'navigate' && sameOrigin(url) && !BYPASS.test(url.pathname),
  new workbox.strategies.NetworkFirst({
    cacheName: PAGE_CACHE,
    networkTimeoutSeconds: 4,
    plugins: [cacheable, serveCacheWhenServerFails, {
      /* عند انقطاع الشبكة: نفس الصفحة المخزَّنة، وإلا صفحة البداية
         offline: the same page's cached copy, otherwise the app shell */
      handlerDidError: async ({ request }) =>
        (await caches.match(request, { ignoreSearch: true })) ||
        (await caches.match('./index.html', { ignoreSearch: true })) ||
        Response.error()
    }]
  })
);

/* 2) الخطوط: التخزين أولاً | fonts: cache-first */
workbox.routing.registerRoute(
  ({ url }) => FONT_HOSTS.includes(url.hostname),
  new workbox.strategies.CacheFirst({ cacheName: FONT_CACHE, plugins: [cacheable] })
);

/* 3) الملفات ذات الأسماء المتغيّرة: التخزين أولاً | hashed assets: cache-first */
workbox.routing.registerRoute(
  ({ url }) => VERSIONED.test(url.pathname),
  new workbox.strategies.CacheFirst({ cacheName: VERSIONED_CACHE, plugins: [cacheable] })
);

/* 4) الصور الخارجية (ويكيميديا): التخزين أولاً لتعمل دون اتصال بعد أول عرض
      external images (Wikimedia): cache-first, so they work offline after the first view */
workbox.routing.registerRoute(
  ({ request, url }) => request.destination === 'image' && !sameOrigin(url),
  new workbox.strategies.CacheFirst({ cacheName: IMAGE_CACHE, plugins: [cacheable] })
);

/* 5) تخزين مسبق كامل: الصفحات + بقية الملفات، يعمل دون اتصال من أول تثبيت
      full precache: pages + remaining assets, offline from the very first install */
workbox.precaching.cleanupOutdatedCaches();
workbox.precaching.precacheAndRoute(
  [...PAGES, ...ASSETS].map(name => ({ url: './' + name, revision: REV })),
  { directoryIndex: null, cleanURLs: false } /* لا نُنشئ مسار تنقّل يخالف «الشبكة أولاً» | no navigation route that would fight network-first */
);

/* 6) أي ملف آخر من نفس الموقع غير مُخزَّن مسبقاً: يُخزَّن عند أول طلب، فلا يبقى شيء خارج العمل دون اتصال
      any other same-origin file that is not precached: cached on first request, so nothing is left out
      (يُسجَّل بعد التخزين المسبق حتى تبقى الأولوية للملفات المخزَّنة مسبقاً
       registered after the precache so precached files keep priority) */
workbox.routing.registerRoute(
  ({ request, url }) => sameOrigin(url) && request.mode !== 'navigate' && !BYPASS.test(url.pathname),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: ASSET_CACHE, plugins: [cacheable] })
);

/* تنظيف نسخنا القديمة عند تغيير REV | drop our own outdated caches when REV changes */
self.addEventListener('activate', event => {
  const keep = new Set([PAGE_CACHE, FONT_CACHE, VERSIONED_CACHE, ASSET_CACHE, IMAGE_CACHE]);
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => /^taif-(pages|fonts|versioned|assets|images)-/.test(k) && !keep.has(k)).map(k => caches.delete(k)));
  })());
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();
