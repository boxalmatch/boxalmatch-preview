/* ============================================================
   Admin review queue.
   The API refuses a non-admin anyway; hiding the controls here is
   for tidiness, not for security.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var el = {};
  var current = 'pending';

  function isIT() { return root.getAttribute('data-lang') !== 'en'; }
  function t(it, en) { return isIT() ? it : en; }

  function show(id) {
    ['r-loading', 'r-offline', 'r-denied', 'r-main'].forEach(function (s) {
      var node = document.getElementById(s);
      if (node) node.hidden = s !== id;
    });
  }

  function say(message, kind) {
    el.msg.textContent = message || '';
    el.msg.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  function humanSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(isIT() ? 'it-IT' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* A preview only for what a browser can actually show inline. */
  function preview(row) {
    var url = window.BMApi.mediaURL(row.objectKey || '');
    var box = document.createElement('div');
    box.className = 'rev-thumb';

    if (row.contentType && row.contentType.indexOf('image/') === 0) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = row.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      box.appendChild(img);
    } else if (row.contentType && row.contentType.indexOf('video/') === 0) {
      var video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.preload = 'metadata';
      box.appendChild(video);
    } else {
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'rev-file';
      link.textContent = t('Apri il file', 'Open the file');
      box.appendChild(link);
    }
    return box;
  }

  function decide(row, status, noteInput) {
    window.BMApi.review(row.id, {
      status: status,
      reviewNote: noteInput ? noteInput.value.trim() : ''
    }).then(function () {
      /* The message is handed to load() rather than set here: load()
         clears the status line as it starts, so anything set first
         disappears the moment the list refreshes. */
      load(current, status === 'approved'
        ? t('Approvato.', 'Approved.')
        : status === 'rejected' ? t('Rifiutato.', 'Rejected.')
        : t('Rimesso in coda.', 'Back in the queue.'));
    }).catch(function (err) { say(err.message, 'bad'); });
  }

  function card(row) {
    var wrap = document.createElement('article');
    wrap.className = 'rev-card';
    wrap.appendChild(preview(row));

    var body = document.createElement('div');
    body.className = 'rev-body';

    var title = document.createElement('h3');
    title.textContent = row.title;
    body.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'rev-meta';
    meta.textContent = [
      row.memberName || row.memberEmail,
      row.event,
      when(row.createdAt),
      humanSize(row.sizeBytes)
    ].filter(Boolean).join(' · ');
    body.appendChild(meta);

    if (row.note) {
      var note = document.createElement('p');
      note.className = 'rev-note';
      note.textContent = row.note;
      body.appendChild(note);
    }

    if (row.status === 'pending') {
      var field = document.createElement('input');
      field.type = 'text';
      field.className = 'rev-reason';
      field.maxLength = 1000;
      field.placeholder = t('Nota per il membro (facoltativa)', 'Note to the member (optional)');
      body.appendChild(field);

      var actions = document.createElement('div');
      actions.className = 'rev-actions';

      var yes = document.createElement('button');
      yes.type = 'button';
      yes.className = 'btn btn-fill';
      yes.textContent = t('Approva', 'Approve');
      yes.addEventListener('click', function () { decide(row, 'approved', field); });

      var no = document.createElement('button');
      no.type = 'button';
      no.className = 'btn btn-quiet';
      no.textContent = t('Rifiuta', 'Reject');
      no.addEventListener('click', function () { decide(row, 'rejected', field); });

      actions.appendChild(yes);
      actions.appendChild(no);
      body.appendChild(actions);
    } else {
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'linkish';
      back.textContent = t('Rimetti in coda', 'Send back to the queue');
      back.addEventListener('click', function () { decide(row, 'pending', null); });
      body.appendChild(back);
    }

    wrap.appendChild(body);
    return wrap;
  }

  function load(status, message) {
    current = status;
    say('');

    window.BMApi.list(status).then(function (data) {
      if (data.unavailable) { show('r-offline'); return; }
      if (!data.isAdmin) { show('r-denied'); return; }

      el.list.textContent = '';
      var rows = data.submissions || [];

      if (status === 'pending') {
        el.count.textContent = rows.length ? String(rows.length) : '';
      }

      if (!rows.length) {
        var empty = document.createElement('p');
        empty.className = 'm-note';
        empty.textContent = t('Niente qui.', 'Nothing here.');
        el.list.appendChild(empty);
      } else {
        rows.forEach(function (row) { el.list.appendChild(card(row)); });
      }

      show('r-main');
      if (message) say(message, 'good');
    }).catch(function (err) {
      if (err.status === 403) { show('r-denied'); return; }
      show('r-main');
      say(err.message, 'bad');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.list = document.getElementById('r-list');
    if (!el.list) return;

    el.msg = document.getElementById('r-msg');
    el.count = document.getElementById('c-pending');
    el.tabs = document.getElementById('r-tabs');

    el.tabs.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      el.tabs.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b === tab); });
      load(tab.dataset.status);
    });

    load('pending');
  });
})();
