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

    var as = links.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) {
      as[i].addEventListener('click', function () {
        links.classList.remove('open');
        burger.classList.remove('on');
        burger.setAttribute('aria-expanded', 'false');
      });
    }
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
    var els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    for (var j = 0; j < els.length; j++) io.observe(els[j]);

    // Safety net: never leave content permanently invisible if the
    // observer doesn't fire (printing, odd viewports, headless capture).
    setTimeout(function () {
      var still = document.querySelectorAll('.rv:not(.in)');
      for (var k = 0; k < still.length; k++) still[k].classList.add('in');
    }, 2600);
  }

  /* ---------- join form ---------- */
  function initForm() {
    var form = document.querySelector('.jform');
    var note = document.getElementById('jnote');
    if (!form) return;

    var EMAIL = 'boxalmatch@gmail.com';

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
    initVideo();
    initPartners();
    initRails();
    initReveal();
    initForm();
  });
})();
