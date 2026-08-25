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

  /* ---------- carousels ---------- */
  function initRails() {
    var btns = document.querySelectorAll('.arrow[data-rail]');

    function sync(rail, group) {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      for (var i = 0; i < group.length; i++) {
        var dir = parseInt(group[i].getAttribute('data-dir'), 10);
        group[i].disabled = dir < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max;
      }
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
          rail.addEventListener('scroll', function () { sync(rail, group); });
          window.addEventListener('resize', function () { sync(rail, group); });
          setTimeout(function () { sync(rail, group); }, 60);
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
    form.addEventListener('submit', function (e) {
      if (form.getAttribute('data-ready') !== 'true') {
        e.preventDefault();
        if (note) {
          note.textContent = root.getAttribute('data-lang') === 'en'
            ? 'Sign-up isn’t connected yet — for now, reach us on Instagram.'
            : 'L’iscrizione non è ancora attiva — per ora scrivici su Instagram.';
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initNav();
    initVideo();
    initRails();
    initReveal();
    initForm();
  });
})();
