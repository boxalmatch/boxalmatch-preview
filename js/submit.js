/* ============================================================
   Member submission form.
   Upload the bytes, then attach the title — the two-step the API
   expects, so a large file never has to be held in memory.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var el = {};
  var chosen = null;
  var busy = false;

  function isIT() { return root.getAttribute('data-lang') !== 'en'; }
  function t(it, en) { return isIT() ? it : en; }

  function show(id) {
    ['s-loading', 's-offline', 's-denied', 's-form'].forEach(function (s) {
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

  function statusLabel(status) {
    if (status === 'approved') return t('Pubblicato', 'Published');
    if (status === 'rejected') return t('Non accettato', 'Not accepted');
    return t('In revisione', 'In review');
  }

  /* ---------- my submissions ---------- */
  function paintList(rows) {
    el.list.textContent = '';

    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'm-note';
      empty.textContent = t('Non hai ancora inviato nulla.', 'You have not submitted anything yet.');
      el.list.appendChild(empty);
      return;
    }

    rows.forEach(function (row) {
      var card = document.createElement('div');
      card.className = 'sub-row';

      var main = document.createElement('div');
      main.className = 'sub-main';

      var title = document.createElement('div');
      title.className = 'sub-title';
      title.textContent = row.title;

      var meta = document.createElement('div');
      meta.className = 'sub-meta';
      meta.textContent = row.filename + ' · ' + humanSize(row.sizeBytes) +
        (row.event ? ' · ' + row.event : '');

      main.appendChild(title);
      main.appendChild(meta);

      if (row.reviewNote) {
        var note = document.createElement('div');
        note.className = 'sub-note';
        note.textContent = row.reviewNote;
        main.appendChild(note);
      }

      var pill = document.createElement('span');
      pill.className = 'pill' + (row.status === 'approved' ? ' soon' : '');
      pill.textContent = statusLabel(row.status);

      card.appendChild(main);
      card.appendChild(pill);

      if (row.status === 'pending') {
        var drop = document.createElement('button');
        drop.type = 'button';
        drop.className = 'linkish';
        drop.textContent = t('Ritira', 'Withdraw');
        drop.addEventListener('click', function () { withdraw(row.id); });
        card.appendChild(drop);
      }

      el.list.appendChild(card);
    });
  }

  function refresh() {
    return window.BMApi.list().then(function (data) {
      if (data.unavailable) { show('s-offline'); return; }
      paintList(data.submissions || []);
      show('s-form');
    }).catch(function (err) {
      if (err.status === 403) {
        document.getElementById('s-denied-msg').textContent = err.message;
        show('s-denied');
        return;
      }
      show('s-form');
      say(err.message, 'bad');
    });
  }

  function withdraw(id) {
    if (!window.confirm(t('Ritirare questo invio?', 'Withdraw this submission?'))) return;
    window.BMApi.remove(id).then(function () {
      say(t('Invio ritirato.', 'Submission withdrawn.'), 'good');
      refresh();
    }).catch(function (err) { say(err.message, 'bad'); });
  }

  /* ---------- picking a file ---------- */
  function pick(file) {
    chosen = file || null;
    el.dropLabel.textContent = chosen
      ? chosen.name + ' · ' + humanSize(chosen.size)
      : t('Scegli un file o trascinalo qui', 'Choose a file or drop it here');
    el.drop.classList.toggle('has-file', !!chosen);
  }

  function wireDrop() {
    ['dragenter', 'dragover'].forEach(function (type) {
      el.drop.addEventListener(type, function (e) {
        e.preventDefault();
        el.drop.classList.add('over');
      });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      el.drop.addEventListener(type, function (e) {
        e.preventDefault();
        el.drop.classList.remove('over');
      });
    });
    el.drop.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) {
        el.file.files = files;
        pick(files[0]);
      }
    });
    el.file.addEventListener('change', function () {
      pick(el.file.files && el.file.files[0]);
    });
  }

  /* ---------- sending ---------- */
  function send(e) {
    e.preventDefault();
    if (busy) return;

    var title = el.title.value.trim();
    if (!chosen) { say(t('Scegli prima un file.', 'Choose a file first.'), 'bad'); return; }
    if (!title) { say(t('Serve un titolo.', 'A title is required.'), 'bad'); el.title.focus(); return; }

    busy = true;
    el.send.disabled = true;
    el.bar.hidden = false;
    el.barFill.style.width = '0%';
    say(t('Caricamento…', 'Uploading…'));

    window.BMApi.upload(chosen, function (fraction) {
      el.barFill.style.width = Math.round(fraction * 100) + '%';
    }).then(function (up) {
      if (up.unavailable) { show('s-offline'); return null; }
      say(t('Quasi fatto…', 'Almost there…'));
      return window.BMApi.create({
        id: up.id,
        key: up.key,
        title: title,
        event: el.event.value.trim(),
        note: el.note.value.trim()
      });
    }).then(function (created) {
      if (!created) return;
      el.form.reset();
      pick(null);
      say(t('Inviato. Lo rivediamo a breve.', 'Sent. We will review it shortly.'), 'good');
      refresh();
    }).catch(function (err) {
      say(err.message, 'bad');
    }).then(function () {
      busy = false;
      el.send.disabled = false;
      el.bar.hidden = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.form = document.getElementById('subform');
    if (!el.form) return;

    el.drop = document.getElementById('drop');
    el.dropLabel = document.getElementById('drop-label');
    el.file = document.getElementById('file');
    el.title = document.getElementById('title');
    el.event = document.getElementById('event');
    el.note = document.getElementById('note');
    el.msg = document.getElementById('s-msg');
    el.send = document.getElementById('s-send');
    el.bar = document.getElementById('bar');
    el.barFill = document.getElementById('bar-fill');
    el.list = document.getElementById('s-list');

    wireDrop();
    el.form.addEventListener('submit', send);
    refresh();
  });
})();
