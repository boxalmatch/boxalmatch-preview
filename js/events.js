/* ============================================================
   Upcoming events on the member page, from Luma.
   ------------------------------------------------------------
   Replaces the hand-written events with whatever /api/events
   returns. It only ever replaces them once real events are in
   hand: if Luma is not configured, unreachable, or simply has
   nothing coming up, the markup already in the page stays exactly
   as it is. A section that empties itself because a feed hiccuped
   is worse than one that is slightly out of date.
   ============================================================ */
(function () {
  'use strict';

  function isIT() {
    return document.documentElement.getAttribute('data-lang') !== 'en';
  }

  function locale() { return isIT() ? 'it-IT' : 'en-GB'; }

  /* An all-day event has no time to show, and a dated one should not have
     its time guessed in a timezone we cannot know. */
  function parts(ev) {
    var d = new Date(ev.start);
    if (isNaN(d)) return null;
    return {
      day: d.toLocaleDateString(locale(), { day: 'numeric' }),
      month: d.toLocaleDateString(locale(), { month: 'short' })
                .replace('.', '').toUpperCase(),
      time: ev.allDay ? '' : d.toLocaleTimeString(locale(),
                { hour: '2-digit', minute: '2-digit' })
    };
  }

  function row(ev) {
    var p = parts(ev);
    if (!p) return null;

    var el = document.createElement('div');
    el.className = 'm-event';

    var when = document.createElement('div');
    when.className = 'when';
    when.innerHTML = '<div class="d"></div><div class="mo"></div>';
    when.querySelector('.d').textContent = p.day;
    when.querySelector('.mo').textContent = p.month;
    el.appendChild(when);

    var info = document.createElement('div');
    info.className = 'info';
    var h = document.createElement('h3');
    h.textContent = ev.title;
    info.appendChild(h);

    /* Time and place first, then whatever the description opens with —
       the two facts someone scanning a list actually needs. */
    var line = [p.time, ev.location].filter(Boolean).join('  ·  ');
    var detail = [line, ev.summary].filter(Boolean).join('  —  ');
    if (detail) {
      var pEl = document.createElement('p');
      pEl.textContent = detail;
      info.appendChild(pEl);
    }
    el.appendChild(info);

    var act = document.createElement('div');
    act.className = 'act';
    if (ev.url) {
      var a = document.createElement('a');
      a.className = 'pill pill-link';
      a.href = ev.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = isIT() ? 'Iscriviti' : 'Register';
      act.appendChild(a);
    } else {
      var span = document.createElement('span');
      span.className = 'pill soon';
      span.textContent = isIT() ? 'In arrivo' : 'Coming';
      act.appendChild(span);
    }
    el.appendChild(act);

    return el;
  }

  function paint(events) {
    var host = document.querySelector('#prossimi-eventi .m-events');
    if (!host) return;

    var rows = events.map(row).filter(Boolean);
    if (!rows.length) return;

    host.textContent = '';
    rows.forEach(function (r) { host.appendChild(r); });

    /* The note explains where events come from, and that stopped being
       "by hand" the moment this worked. */
    var notes = document.querySelectorAll('#prossimi-eventi .m-note');
    for (var i = 0; i < notes.length; i++) {
      var en = notes[i].getAttribute('lang') === 'en';
      notes[i].textContent = en
        ? 'Straight from our Luma calendar.'
        : 'Presi direttamente dal nostro calendario Luma.';
    }
  }

  function load() {
    if (!window.BMApi || !window.BMApi.events) return;
    window.BMApi.events().then(function (data) {
      if (!data || data.unavailable || !data.configured) return;
      paint(data.events || []);
    }).catch(function () { /* keep whatever the page already shows */ });
  }

  document.addEventListener('DOMContentLoaded', load);
  /* Dates and the button are language-dependent, so a toggle has to redraw. */
  document.addEventListener('bm:lang', load);
})();
