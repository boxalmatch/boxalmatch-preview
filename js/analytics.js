/* ============================================================
   Cloudflare Web Analytics.
   ------------------------------------------------------------
   Off until a token is set. Put the one from
   Cloudflare dashboard -> Analytics & Logs -> Web Analytics
   into TOKEN below and it starts reporting on the next deploy;
   leave it empty and this file does nothing at all.

   Cloudflare's own beacon is the choice here rather than a
   general-purpose analytics product: it sets no cookies, stores
   no identifiers, and does not follow anyone between sites,
   which is why it needs no consent banner. That matters on a
   site with no privacy policy yet.

   The token is not a secret — it ships in the page on every
   site that uses this, and it only identifies which site a hit
   belongs to. It is in a file of its own so switching it on is
   one line in one place rather than an edit to forty pages.
   ============================================================ */
(function () {
  'use strict';

  var TOKEN = '';   /* <- paste the Web Analytics token here */

  if (!TOKEN) return;

  /* Honour a browser that asks not to be tracked. The beacon is already
     anonymous, so this is belt and braces — but a request someone has
     explicitly made is worth respecting even when it costs a data point. */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
