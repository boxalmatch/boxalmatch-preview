(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'bam-lang';

  /* ---------- language ---------- */
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem(KEY, l); } catch (e) {}
    var btns = document.querySelectorAll('.lang button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', btns[i].getAttribute('data-set') === l);
    }
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    setLang(saved === 'en' || saved === 'it' ? saved : 'it');

    var btns = document.querySelectorAll('.lang button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        setLang(this.getAttribute('data-set'));
      });
    }
  }

  /* ---------- mobile nav ---------- */
  function initNav() {
    var burger = document.getElementById('burger');
    var links = document.getElementById('navlinks');
    if (!burger || !links) return;

    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('on', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* Delegated, not bound per link: the signed-in user item is injected
       after this runs, and a direct binding would miss it. */
    links.addEventListener('click', function (e) {
      if (!e.target.closest('a')) return;
      links.classList.remove('open');
      burger.classList.remove('on');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  /* ============================================================
     SIGNED-IN USER
     ------------------------------------------------------------
     Cloudflare Access exposes the current user at
     /cdn-cgi/access/get-identity. On pages that are not behind
     Access the call simply fails, and nothing is rendered — which
     is what a logged-out visitor should see.
     ============================================================ */

  var IN_MEMBERS = /\/members\//.test(location.pathname);

  /* Links into the member area resolve differently depending on whether
     the current page already lives inside members/. */
  function memberHref(hash) {
    return (IN_MEMBERS ? 'index.html' : 'members/index.html') + (hash || '');
  }

  /* returnTo brings the browser back to the home page instead of
     leaving it on Cloudflare's bare "logged out" screen. */
  function logoutHref() {
    return '/cdn-cgi/access/logout?returnTo=' +
      encodeURIComponent(location.origin + '/');
  }

  /* Everything the member area offers. The desktop bar shows none of it —
     this menu is the single place it lives up there. */
  var USER_SECTIONS = [
    ['#contenuti-riservati', 'Contenuti riservati', 'Member content'],
    ['#prossimi-eventi', 'Prossimi eventi', 'Upcoming events'],
    ['#community', 'Community', 'Community']
  ];

  var USER_PAGES = [
    ['submit.html', 'Invia contenuti', 'Submit content'],
    ['card.html', 'La mia tessera', 'My card']
  ];

  function memberPage(file) {
    return (IN_MEMBERS ? '' : 'members/') + file;
  }

  function bilingual(it, en) {
    if (it === en) return document.createTextNode(it);
    var frag = document.createDocumentFragment();
    var a = document.createElement('span');
    a.setAttribute('lang', 'it');
    a.textContent = it;
    var b = document.createElement('span');
    b.setAttribute('lang', 'en');
    b.textContent = en;
    frag.appendChild(a);
    frag.appendChild(b);
    return frag;
  }

  function personIcon() {
    var span = document.createElement('span');
    span.className = 'user-ic';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="12" cy="7" r="4"></circle></svg>';
    return span;
  }

  function displayName(identity, member) {
    if (member && member.name) return member.name.split(' ')[0];
    if (identity.name) return String(identity.name).split(' ')[0];
    return String(identity.email).split('@')[0];
  }

  function buildDesktopUser(name) {
    var right = document.querySelector('.nav-right');
    if (!right || right.querySelector('.user')) return;

    var wrap = document.createElement('div');
    wrap.className = 'user';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'user-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(personIcon());
    var label = document.createElement('span');
    label.className = 'user-name';
    label.textContent = name;
    btn.appendChild(label);

    var menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.hidden = true;

    USER_SECTIONS.forEach(function (row) {
      var a = document.createElement('a');
      a.href = memberHref(row[0]);
      a.appendChild(bilingual(row[1], row[2]));
      menu.appendChild(a);
    });

    USER_PAGES.forEach(function (row) {
      var a = document.createElement('a');
      a.href = memberPage(row[0]);
      a.appendChild(bilingual(row[1], row[2]));
      menu.appendChild(a);
    });

    /* Slot for the review queue, filled in only for admins. */
    var review = document.createElement('a');
    review.href = memberPage('review.html');
    review.className = 'review-link';
    review.hidden = true;
    review.appendChild(bilingual('Revisione invii', 'Review submissions'));
    menu.appendChild(review);

    var out = document.createElement('a');
    out.href = logoutHref();
    out.className = 'signout';
    out.appendChild(bilingual('Esci', 'Sign out'));
    menu.appendChild(out);

    function close() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });

    /* Close on any link inside it. Following one is usually a real
       navigation that takes the menu with it, but not always: on the
       member home the section links are same-document jumps, and the
       menu would sit there open over the section it just moved to. */
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    /* Coming back via the back button can restore the page from the
       bfcache with the menu exactly as it was left. */
    window.addEventListener('pageshow', close);
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    /* before the burger, so the burger stays hard against the edge */
    right.insertBefore(wrap, right.querySelector('.burger'));
  }

  /* On a phone the chip would crowd a 48px bar, so the user becomes the
     last item of the burger menu instead — a plain link into the member
     area, as asked. Pointless on the member pages themselves. */
  function buildMobileUser(name) {
    if (IN_MEMBERS) return;
    var links = document.getElementById('navlinks');
    if (!links || links.querySelector('.nav-user')) return;

    var a = document.createElement('a');
    a.className = 'nav-user';
    a.href = memberHref('');
    a.appendChild(personIcon());
    var label = document.createElement('span');
    label.textContent = name;
    a.appendChild(label);
    links.appendChild(a);
  }

  /* The sign-out link in the member nav is static markup; give it the
     returnTo so it lands on the home page rather than Cloudflare's
     bare "you are logged out" screen. */
  function initSignoutLinks() {
    var as = document.querySelectorAll('a.signout');
    for (var i = 0; i < as.length; i++) {
      if (as[i].closest('.user-menu')) continue;
      as[i].href = logoutHref();
    }
  }

  function initUser() {
    var identity = null;

    fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (id) {
        if (!id || !id.email) return null;
        identity = id;
        /* The registry holds the real name; the token may carry none. */
        return fetch(IN_MEMBERS ? 'members.json' : 'members/members.json',
                     { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
      })
      .then(function (registry) {
        if (!identity) return;
        var email = String(identity.email).toLowerCase();
        var list = (registry && registry.members) || [];
        var member = null;
        for (var i = 0; i < list.length; i++) {
          if (String(list[i].email).toLowerCase() === email) { member = list[i]; break; }
        }
        var name = displayName(identity, member);
        buildDesktopUser(name);
        buildMobileUser(name);
        revealAdminLinks();
      });
  }

  /* The review queue is admin-only, and the browser cannot know who is an
     admin — ADMIN_EMAILS lives in the deployment, not in the page. The API
     reports it, so ask once per session and remember the answer rather than
     showing every member a link that will refuse them. */
  function revealAdminLinks() {
    var CACHE = 'bm-admin';
    var known = null;
    try { known = sessionStorage.getItem(CACHE); } catch (e) { /* private mode */ }

    if (known !== null) {
      if (known === '1') showAdminLinks();
      return;
    }

    fetch('/api/submissions', { credentials: 'same-origin' })
      .then(function (r) {
        var type = r.headers.get('content-type') || '';
        return type.indexOf('application/json') === -1 ? null : r.json();
      })
      .catch(function () { return null; })
      .then(function (data) {
        var admin = !!(data && data.isAdmin);
        try { sessionStorage.setItem(CACHE, admin ? '1' : '0'); } catch (e) {}
        if (admin) showAdminLinks();
      });
  }

  function showAdminLinks() {
    var slot = document.querySelector('.user-menu .review-link');
    if (slot) slot.hidden = false;

    /* the phone's burger panel carries the same set */
    var links = document.getElementById('navlinks');
    if (!links || !links.classList.contains('member-nav')) return;
    if (links.querySelector('.review-link')) return;

    var a = document.createElement('a');
    a.className = 'review-link';
    a.href = 'review.html';
    a.appendChild(bilingual('Revisione invii', 'Review submissions'));
    var signout = links.querySelector('a.signout');
    links.insertBefore(a, signout || null);
  }

  /* ---------- youtube click-to-play ---------- */
  function playFrame(el) {
    if (el.getAttribute('data-loaded') === '1') return;
    var q = el.getAttribute('data-yt');
    if (!q) return;
    var sep = q.indexOf('?') > -1 ? '&' : '?';
    var src = 'https://www.youtube-nocookie.com/embed/' + q + sep +
              'autoplay=1&rel=0&modestbranding=1';
    var f = document.createElement('iframe');
    f.setAttribute('src', src);
    f.setAttribute('title', el.getAttribute('aria-label') || 'YouTube');
    f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('loading', 'lazy');
    el.innerHTML = '';
    el.appendChild(f);
    el.setAttribute('data-loaded', '1');
  }

  function initVideo() {
    var frames = document.querySelectorAll('.vframe[data-yt]');
    for (var i = 0; i < frames.length; i++) {
      (function (el) {
        el.addEventListener('click', function () { playFrame(el); });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            playFrame(el);
          }
        });
      })(frames[i]);
    }
  }


  /* ---------- partners ---------- */
  // One partner is just a centred card. From two upwards it becomes a rail
  // with the same arrows and dots as the other carousels, built here rather
  // than sitting in the markup unused.
  function initPartners() {
    var row = document.getElementById('rail-partners');
    if (!row || row.children.length < 2) return;

    row.classList.add('is-rail');
    var arrows = document.createElement('div');
    arrows.className = 'arrows';
    arrows.innerHTML =
      '<button class="arrow" data-rail="rail-partners" data-dir="-1" aria-label="Previous">\u2039</button>' +
      '<button class="arrow" data-rail="rail-partners" data-dir="1" aria-label="Next">\u203a</button>';
    row.parentNode.insertBefore(arrows, row.nextSibling);
  }

  /* ---------- carousels ---------- */
  function initRails() {
    var btns = document.querySelectorAll('.arrow[data-rail]');

    // Position along the rail, mapped evenly onto the dots. Nearest-to-centre
    // reads wrong when two and a half cards are visible at once: at rest the
    // rail is at scrollLeft 0 but the card nearest the centre is the second
    // one, so the indicator would open on dot 2.
    function current(rail) {
      var n = rail.children.length;
      var max = rail.scrollWidth - rail.clientWidth;
      if (n < 2 || max <= 0) return 0;
      return Math.min(n - 1, Math.max(0, Math.round(rail.scrollLeft / max * (n - 1))));
    }

    function sync(rail, group, dots) {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      for (var i = 0; i < group.length; i++) {
        var dir = parseInt(group[i].getAttribute('data-dir'), 10);
        group[i].disabled = dir < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max;
      }
      if (!dots) return;
      paintDots(dots, current(rail));
    }

    // Instagram's sliding dot window: the active dot stays centred, the ones
    // either side of it shrink, and anything past the window is off the strip.
    var WINDOW = 7;

    function paintDots(dots, at) {
      var track = dots.firstElementChild;
      var kids = track.children;
      var n = kids.length;
      for (var i = 0; i < n; i++) {
        var off = Math.abs(i - at);
        kids[i].className = 'dot' + (i === at ? ' on' : off === 2 ? ' near' : off > 2 ? ' far' : '');
        kids[i].setAttribute('aria-selected', i === at ? 'true' : 'false');
        kids[i].tabIndex = i === at ? 0 : -1;
      }
      if (n <= WINDOW) { track.style.transform = ''; return; }
      var slot = parseFloat(getComputedStyle(dots).getPropertyValue('--dot-slot')) || 14;
      // clamp so the strip never scrolls past either end
      var shift = Math.min(Math.max(at - (WINDOW - 1) / 2, 0), n - WINDOW);
      track.style.transform = 'translateX(' + (-shift * slot) + 'px)';
    }

    // one dot per slide, dropped between the two arrows
    function buildDots(rail, arrows) {
      if (rail.children.length < 2) return null;
      var dots = document.createElement('div');
      dots.className = 'dots';
      dots.setAttribute('role', 'tablist');
      dots.setAttribute('aria-label', 'Slides');
      var track = document.createElement('div');
      track.className = 'dots-track';
      dots.appendChild(track);
      for (var i = 0; i < rail.children.length; i++) {
        (function (i) {
          var d = document.createElement('button');
          d.type = 'button';
          d.className = 'dot';
          d.setAttribute('role', 'tab');
          d.setAttribute('aria-label', 'Slide ' + (i + 1));
          d.addEventListener('click', function () {
            var c = rail.children[i];
            rail.scrollTo({ left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
          });
          track.appendChild(d);
        })(i);
      }
      // between prev and next, so the row reads  <  ....  >
      arrows.insertBefore(dots, arrows.lastElementChild);
      return dots;
    }

    var seen = {};
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        var id = btn.getAttribute('data-rail');
        var rail = document.getElementById(id);
        if (!rail) return;

        btn.addEventListener('click', function () {
          var card = rail.firstElementChild;
          var step = card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
          rail.scrollBy({ left: step * parseInt(btn.getAttribute('data-dir'), 10), behavior: 'smooth' });
        });

        if (!seen[id]) {
          seen[id] = true;
          var group = document.querySelectorAll('.arrow[data-rail="' + id + '"]');
          var dots = buildDots(rail, btn.parentNode);
          rail.addEventListener('scroll', function () { sync(rail, group, dots); });
          window.addEventListener('resize', function () { sync(rail, group, dots); });
          setTimeout(function () { sync(rail, group, dots); }, 60);
        }
      })(btns[i]);
    }
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    // Rows and grids reveal their own children, so a group cascades instead of
    // landing in one piece. Marked here rather than in the markup: these are
    // the same containers the rest of the page already knows about.
    var GROUPS = ['.vals', '.egrid', '.channels', '.ig-grid', '.partners', '.rail'];
    GROUPS.forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      for (var i = 0; i < group.children.length; i++) {
        group.children[i].classList.add('rv');
      }
    });

    var els = document.querySelectorAll('.rv');

    // stagger by position within the parent, capped so a long row never ends
    // up waiting on the item before it
    for (var d = 0; d < els.length; d++) {
      var el = els[d];
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--rv-delay', Math.min(index, 5) * 0.07 + 's');
    }

    function arrive(el) {
      el.classList.add('in');
      // drop the compositing hint once the transition is over
      setTimeout(function () { el.classList.add('done'); }, 1400);
    }

    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) arrive(els[i]);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          arrive(en.target);
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    for (var j = 0; j < els.length; j++) io.observe(els[j]);

    // Safety net: never leave content permanently invisible if the
    // observer doesn't fire (printing, odd viewports, headless capture).
    setTimeout(function () {
      var still = document.querySelectorAll('.rv:not(.in)');
      for (var k = 0; k < still.length; k++) arrive(still[k]);
    }, 2600);
  }

  /* ---------- join form ---------- */
  function initForm() {
    var form = document.querySelector('.jform');
    var note = document.getElementById('jnote');
    if (!form) return;

    var EMAIL = 'info@boxalmatch.com';

    function say(it, en) {
      if (note) note.textContent = root.getAttribute('data-lang') === 'en' ? en : it;
    }

    // the address as a real link, so there is always something to click even
    // if the visitor has no mail client wired up
    function sayWithAddress(it, en) {
      if (!note) return;
      note.textContent = (root.getAttribute('data-lang') === 'en' ? en : it) + ' ';
      var a = document.createElement('a');
      a.href = 'mailto:' + EMAIL;
      a.textContent = EMAIL;
      note.appendChild(a);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.name.value || '').trim();
      var from = (form.elements.email.value || '').trim();
      var body = (form.elements.message.value || '').trim();

      if (!name || !from || !body) {
        say('Compila tutti i campi prima di inviare.',
            'Please fill in every field before sending.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
        say('Controlla l’indirizzo email.', 'Please check the email address.');
        return;
      }

      // A form service, if one has been wired up: it posts server-side and the
      // visitor never leaves the page.
      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint) {
        var send = form.querySelector('button[type=submit]');
        if (send) send.disabled = true;
        say('Invio in corso…', 'Sending…');
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          say('Messaggio inviato, grazie!', 'Message sent — thank you!');
        }).catch(function () {
          sayWithAddress('Invio non riuscito. Scrivici a',
                         'Sending failed. Write to us at');
        }).then(function () {
          if (send) send.disabled = false;
        });
        return;
      }

      // Otherwise hand the message to the visitor's mail client, pre-addressed
      // and pre-filled. There is no server on GitHub Pages to post to, and a
      // bare mailto: form would send a raw urlencoded blob.
      var subject = 'BOXALMATCH \u2014 ' + name;
      var text = name + ' <' + from + '>\n\n' + body;
      form.dataset.mailto = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(text);
      window.location.href = form.dataset.mailto;
      sayWithAddress('Apriamo il tuo programma di posta con il messaggio pronto. ' +
                     'Se non succede nulla, scrivici a',
                     'Opening your mail app with the message ready. ' +
                     'If nothing happens, write to us at');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initNav();
    initUser();
    initSignoutLinks();
    initVideo();
    initPartners();
    initRails();
    initReveal();
    initForm();
  });
})();
