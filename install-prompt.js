/* نافذة إشعار التثبيت | install banner
   تخبر الزائر أنه يمكنه تنزيل الموقع كتطبيق وتثبيته على جهازه.
   Tells the visitor they can download the site as an app and install it on their device.

   قواعد السلوك | behaviour rules
   - لا تظهر داخل إطار المعاينة، ولا في بيئة التطوير، ولا للصفحات المحلية، ولا إن كان التطبيق مثبّتاً.
     Never shown inside the preview frame, in a dev environment, for local files, or when already installed.
   - تظهر مرة واحدة في كل جلسة، وتُغلق نهائياً إذا اختار الزائر الإغلاق أو التثبيت.
     Shown once per session; dismissed for good if the visitor closes it or installs.
   - كل نص مكتوب بالعربية والإنجليزية | every string exists in Arabic and English
*/
(function () {
  'use strict';

  /* ---- شروط العرض | display conditions ---- */
  if (window.self !== window.top) return;                       /* داخل إطار | inside a frame */
  if (!location.protocol.startsWith('http')) return;            /* ملف محلي | local file */
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i.test(location.hostname)) return; /* تطوير | dev */
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return; /* مثبّت | installed */
  if (window.navigator.standalone === true) return;             /* مثبّت على آيفون | installed on iOS */
  try {
    if (localStorage.getItem('taif-install') === '1') return;    /* رفضه نهائياً | dismissed for good */
    if (sessionStorage.getItem('taif-install-session') === '1') return; /* عرض سابق في الجلسة | already offered */
  } catch (e) { /* التخزين قد يكون معطّلاً | storage may be disabled */ }

  /* ---- النصوص | the strings ---- */
  var TEXT = {
    ar: {
      title: 'ثبّت «مرشد الطائف» على جهازك',
      body: 'يُثبَّت على جهازك ويُفتح من قائمة التطبيقات، ويعمل دون اتصال بالإنترنت بعد أول زيارة.',
      install: 'تثبيت التطبيق',
      later: 'لاحقاً',
      how: 'من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
      ios: 'آيفون: اضغط زر المشاركة ⤴ ثم «إضافة إلى الشاشة الرئيسية».',
      close: 'إغلاق'
    },
    en: {
      title: 'Install Taif Guide on your device',
      body: 'Installs on your device, opens from your apps list, and works offline after the first visit.',
      install: 'Install app',
      later: 'Not now',
      how: 'From your browser menu choose “Install app” or “Add to Home Screen”.',
      ios: 'iPhone: tap Share ⤴ then “Add to Home Screen”.',
      close: 'Close'
    }
  };
  var lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  /* ---- الأنماط | the styles (same palette as the site) ---- */
  var css = document.createElement('style');
  css.textContent =
    '#taifInstall{position:fixed;inset-inline:1rem;bottom:1rem;z-index:9999;max-width:520px;' +
    'margin-inline:auto;background:#fffdfa;color:#2b2522;border:1px solid #f0d8df;border-radius:22px;' +
    'box-shadow:0 18px 50px rgba(142,42,74,.13),0 4px 14px rgba(30,68,51,.09);padding:1rem 1.1rem;' +
    'display:flex;gap:.9rem;align-items:flex-start;font-size:.92rem;line-height:1.7;' +
    'transform:translateY(130%);opacity:0;transition:transform .35s ease,opacity .35s ease}' +
    '#taifInstall.on{transform:translateY(0);opacity:1}' +
    '#taifInstall .ti-ico{flex:0 0 auto;width:42px;height:42px;border-radius:12px;overflow:hidden;' +
    'background:linear-gradient(135deg,#8e2a4a,#c14a6e);display:grid;place-items:center;color:#fff;font-size:1.15rem}' +
    '#taifInstall h3{margin:0 0 .15rem;font-size:1rem;color:#1e4433}' +
    '#taifInstall p{margin:0;color:#75685f;font-size:.85rem}' +
    '#taifInstall .ti-hint{margin-top:.5rem;font-size:.82rem;color:#8e2a4a;font-weight:700}' +
    '#taifInstall .ti-acts{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.7rem;align-items:center}' +
    '#taifInstall button{font-family:inherit;cursor:pointer;border:0;border-radius:999px;' +
    'padding:.5rem 1rem;font-weight:800;font-size:.86rem}' +
    '#taifInstall .ti-go{background:linear-gradient(135deg,#8e2a4a,#c14a6e);color:#fff}' +
    '#taifInstall .ti-later{background:#fceef2;color:#8e2a4a}' +
    '#taifInstall .ti-x{margin-inline-start:auto;background:transparent;color:#75685f;font-size:1.1rem;' +
    'padding:.1rem .45rem;line-height:1}' +
    '@media(max-width:520px){#taifInstall{inset-inline:.6rem;bottom:.6rem;padding:.85rem}}';
  document.head.appendChild(css);

  /* ---- العنصر | the element ---- */
  var box = document.createElement('div');
  box.id = 'taifInstall';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);

  var deferred = null;   /* حدث التثبيت القادم من المتصفح | the browser install event */
  var timer = null;
  var done = false;

  function t() { return TEXT[lang]; }

  function paint() {
    var s = t();
    box.dir = lang === 'ar' ? 'rtl' : 'ltr';
    box.innerHTML =
      '<span class="ti-ico" aria-hidden="true">⬇</span>' +
      '<div style="flex:1 1 auto;min-width:0">' +
        '<h3>' + s.title + '</h3>' +
        '<p>' + s.body + '</p>' +
        (deferred ? '' : '<div class="ti-hint">' + (isIOS ? s.ios : s.how) + '</div>') +
        '<div class="ti-acts">' +
          (deferred ? '<button type="button" class="ti-go">' + s.install + '</button>' : '') +
          '<button type="button" class="ti-later">' + s.later + '</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="ti-x" aria-label="' + s.close + '" title="' + s.close + '">✕</button>';

    if (deferred) box.querySelector('.ti-go').addEventListener('click', onInstall);
    box.querySelector('.ti-later').addEventListener('click', function () { hide(false); });
    box.querySelector('.ti-x').addEventListener('click', function () { hide(false); });
  }

  function show() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('taif-install-session', '1'); } catch (e) {}
    paint();
    /* نستخدم مؤقتاً لا requestAnimationFrame: الأخير يتوقف في التبويب غير الظاهر
       a timer, not requestAnimationFrame: the latter is paused in a hidden tab */
    setTimeout(function () { box.classList.add('on'); }, 30);
  }

  /* إغلاق: keep = إخفاء نهائي | hide for good */
  function hide(keep) {
    box.classList.remove('on');
    if (keep) { try { localStorage.setItem('taif-install', '1'); } catch (e) {} }
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
  }

  function onInstall() {
    if (!deferred) return;
    var ev = deferred;
    deferred = null;
    ev.prompt();
    ev.userChoice.then(function (choice) {
      if (choice && choice.outcome === 'accepted') hide(true);  /* ثُبّت | installed */
      else hide(false);                                         /* رفض | declined now */
    }).catch(function () { hide(false); });
  }

  /* ---- الأحداث | the events ---- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();              /* نمنع الشريط الافتراضي ونُظهر نافذتنا | suppress the default bar, show ours */
    deferred = e;
    if (timer) { clearTimeout(timer); timer = null; }
    show();
  });

  window.addEventListener('appinstalled', function () { hide(true); });

  /* إن لم يصل حدث التثبيت (آيفون مثلاً) نعرض الإرشاد بعد لحظة
     if no install event arrives (e.g. iPhone) we show the guidance shortly after */
  timer = setTimeout(show, 1500);

  /* نتبع تبديل اللغة في الموقع | follow the site's language toggle */
  try {
    new MutationObserver(function () {
      var next = document.documentElement.lang === 'en' ? 'en' : 'ar';
      if (next !== lang) { lang = next; if (box.parentNode) paint(); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {}
})();
