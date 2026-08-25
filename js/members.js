/* ============================================================
   Member area — identity + card rendering
   ------------------------------------------------------------
   Identity comes from Cloudflare Access, which exposes the
   signed-in user at /cdn-cgi/access/get-identity. That endpoint
   only exists once the site sits behind Access; locally we fall
   back to a demo member so the page can be worked on offline.
   ============================================================ */
(function () {
  'use strict';

  var DEMO = {
    email: 'demo@boxalmatch.it',
    name: 'Demo Member',
    number: '0000',
    since: '2026',
    role: 'Anteprima'
  };

  var root = document.documentElement;

  function isIT() { return root.getAttribute('data-lang') !== 'en'; }

  function show(id) {
    ['m-loading', 'm-denied', 'm-content'].forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.hidden = s !== id;
    });
  }

  /* ---------- identity ---------- */
  function getIdentity() {
    return fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function getRegistry() {
    return fetch('members.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ---------- card ---------- */
  function cardURL(member) {
    // Encoded in the QR: a stable, shareable pointer to this membership.
    return location.origin + '/members/card.html?n=' + encodeURIComponent(member.number);
  }

  function paintCard(member) {
    var nameEl = document.querySelector('[data-card-name]');
    var metaEl = document.querySelector('[data-card-meta]');
    var roleEl = document.querySelector('[data-card-role]');
    var qrEl = document.querySelector('[data-card-qr]');

    if (nameEl) nameEl.textContent = member.name;
    if (metaEl) {
      metaEl.textContent = 'N. ' + member.number + '  ·  ' +
        (isIT() ? 'DAL ' : 'SINCE ') + member.since;
    }
    if (roleEl) roleEl.textContent = member.role || 'Member';

    if (qrEl && window.QR) {
      try {
        window.QR.render(qrEl, cardURL(member), { fg: '#071409', bg: '#ffffff', quiet: 1 });
      } catch (e) {
        qrEl.textContent = '';
      }
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    Promise.all([getIdentity(), getRegistry()]).then(function (res) {
      var identity = res[0];
      var registry = res[1];
      var list = (registry && registry.members) || [];

      // No Access in front of the page (local dev / preview) → demo mode.
      if (!identity || !identity.email) {
        var banner = document.getElementById('m-demo');
        if (banner) banner.hidden = false;
        paintCard(DEMO);
        show('m-content');
        return;
      }

      var email = String(identity.email).toLowerCase();
      var member = null;
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].email).toLowerCase() === email) { member = list[i]; break; }
      }

      if (!member) {
        var who = document.getElementById('denied-email');
        if (who) who.textContent = identity.email;
        show('m-denied');
        return;
      }

      var greet = document.querySelector('[data-greet]');
      if (greet) {
        greet.textContent = (isIT() ? 'Ciao, ' : 'Hi, ') +
          member.name.split(' ')[0] + '.';
      }
      paintCard(member);
      show('m-content');
    });
  }

  /* Re-render language-dependent card text when the toggle is used. */
  function watchLang() {
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function () {
      var n = document.querySelector('[data-card-name]');
      if (n && n.textContent) boot();
    }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
  }

  document.addEventListener('DOMContentLoaded', function () {
    boot();
    watchLang();
  });
})();
