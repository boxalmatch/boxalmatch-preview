/* ============================================================
   The shared archive browser (members/archive.html).
   ------------------------------------------------------------
   Renders one folder at a time from /api/library. The bucket is
   private; every file link points at /api/media, which checks the
   Access identity again before it hands over a byte.

   State lives in the URL hash rather than in a variable, so the
   back button walks back up the folders and a link to a folder can
   be pasted to someone. They still have to get through Access to
   open it.
   ============================================================ */
(function () {
  'use strict';

  var listEl, crumbEl, msgEl, moreBtn, upSec, upList;
  var current = '';
  var cursor = null;

  function isIT() {
    return document.documentElement.getAttribute('data-lang') !== 'en';
  }

  function show(id) {
    ['a-loading', 'a-offline', 'a-main'].forEach(function (x) {
      var el = document.getElementById(x);
      if (el) el.hidden = (x !== id);
    });
  }

  /* 1 decimal place up to GB: these are photos and video, and "1.4 GB"
     is the number that tells someone whether to wait for hotel wifi. */
  function size(bytes) {
    if (!bytes && bytes !== 0) return '';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0;
    var n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(1)) + ' ' + units[i];
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(isIT() ? 'it-IT' : 'en-GB',
      { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function icon(name) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic'].indexOf(ext) !== -1) return '▣';
    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].indexOf(ext) !== -1) return '▷';
    if (['mp3', 'wav', 'm4a', 'aac'].indexOf(ext) !== -1) return '♪';
    if (['pdf', 'doc', 'docx', 'txt', 'md'].indexOf(ext) !== -1) return '▤';
    return '◆';
  }

  function crumbs(path) {
    crumbEl.textContent = '';
    var parts = path ? path.split('/') : [];

    var root = document.createElement('a');
    root.href = '#';
    root.textContent = isIT() ? 'Archivio' : 'Archive';
    crumbEl.appendChild(root);

    var acc = [];
    parts.forEach(function (part, i) {
      acc.push(part);
      var sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '/';
      sep.setAttribute('aria-hidden', 'true');
      crumbEl.appendChild(sep);

      if (i === parts.length - 1) {
        var here = document.createElement('span');
        here.className = 'here';
        here.setAttribute('aria-current', 'location');
        here.textContent = part;
        crumbEl.appendChild(here);
      } else {
        var a = document.createElement('a');
        a.href = '#' + acc.join('/');
        a.textContent = part;
        crumbEl.appendChild(a);
      }
    });
  }

  function folderRow(f) {
    var a = document.createElement('a');
    a.className = 'ar-row ar-folder';
    a.href = '#' + f.path;
    a.innerHTML = '<span class="ar-ic" aria-hidden="true">▸</span>';
    var name = document.createElement('span');
    name.className = 'ar-name';
    name.textContent = f.name;
    a.appendChild(name);
    var go = document.createElement('span');
    go.className = 'ar-meta';
    go.textContent = isIT() ? 'Cartella' : 'Folder';
    a.appendChild(go);
    return a;
  }

  function fileRow(f) {
    var a = document.createElement('a');
    a.className = 'ar-row';
    a.href = f.href;
    /* New tab: following a file must not navigate the browser away from
       the folder the member is standing in. */
    a.target = '_blank';
    a.rel = 'noopener';
    /* iconName, not name: an upload is labelled with the member's title
       ("Finale Halo"), which has no extension to read a type from. */
    a.innerHTML = '<span class="ar-ic" aria-hidden="true">' + icon(f.iconName || f.name) + '</span>';
    var name = document.createElement('span');
    name.className = 'ar-name';
    name.textContent = f.name;
    a.appendChild(name);
    var meta = document.createElement('span');
    meta.className = 'ar-meta';
    meta.textContent = [size(f.size), when(f.uploaded)].filter(Boolean).join('  ·  ');
    a.appendChild(meta);
    return a;
  }

  /* Approved uploads, listed from the database rather than from the bucket.
     A member's upload is keyed pending/<id>/<file> when it arrives and stays
     there when it is approved — approval only flips a column — so the only
     way these appear in an archive is by asking D1 what is approved. */
  function statusLabel(status) {
    if (status === 'pending') return isIT() ? 'In attesa di revisione' : 'Awaiting review';
    if (status === 'rejected') return isIT() ? 'Non approvato' : 'Not approved';
    return '';
  }

  function uploadRow(r) {
    var row = fileRow({
      name: r.title || r.filename,
      iconName: r.filename,
      size: r.sizeBytes,
      uploaded: r.createdAt,
      href: window.BMApi.mediaURL(
        String(r.objectKey).split('/').map(encodeURIComponent).join('/'))
    });
    if (r.status !== 'approved') {
      row.classList.add('ar-waiting');
      var chip = document.createElement('span');
      chip.className = 'ar-chip';
      chip.textContent = statusLabel(r.status);
      /* Before the size and date, so the state is the first thing read
         on the row rather than the last. */
      row.insertBefore(chip, row.querySelector('.ar-meta'));
    }
    return row;
  }

  function loadUploads(path) {
    if (path) { upSec.hidden = true; return Promise.resolve(); }

    /* Two lists, because they answer two different questions. The approved
       pool is what every member may see. The caller's own rows are what
       answers "where did my upload go?" — a file sitting at pending is
       invisible to everyone else by design, and a page that simply showed
       nothing is what made that look like a bug rather than a queue. */
    return Promise.all([
      window.BMApi.list('approved'),
      window.BMApi.list()
    ]).then(function (res) {
      var shared = (res[0] && res[0].submissions) || [];
      var mine = (res[1] && res[1].submissions) || [];
      if ((res[0] && res[0].unavailable) || (res[1] && res[1].unavailable)) {
        upSec.hidden = true;
        return;
      }

      /* Own approved rows arrive in both lists. */
      var seen = {};
      shared.forEach(function (r) { seen[r.id] = true; });
      var waiting = mine.filter(function (r) { return !seen[r.id]; });

      upList.textContent = '';
      shared.forEach(function (r) { upList.appendChild(uploadRow(r)); });
      waiting.forEach(function (r) { upList.appendChild(uploadRow(r)); });

      upSec.hidden = !(shared.length || waiting.length);
    }).catch(function () { upSec.hidden = true; });
  }

  function render(data, append) {
    if (!append) listEl.textContent = '';

    data.folders.forEach(function (f) { listEl.appendChild(folderRow(f)); });
    data.files.forEach(function (f) { listEl.appendChild(fileRow(f)); });

    cursor = data.cursor;
    moreBtn.hidden = !data.truncated;

    if (!listEl.children.length) {
      /* At the root this is the common case rather than an error: library/
         is filled by hand and may simply not exist yet, while the uploads
         section below can still have plenty in it. Say which is which. */
      msgEl.textContent = isIT()
        ? (current ? 'Questa cartella è vuota.'
                   : 'Nessun file in library/ nel bucket. Gli invii approvati dei membri sono qui sotto.')
        : (current ? 'This folder is empty.'
                   : 'Nothing under library/ in the bucket yet. Approved member uploads are listed below.');
    } else {
      msgEl.textContent = '';
    }
  }

  function load(path, append) {
    msgEl.textContent = '';
    if (!append) {
      listEl.setAttribute('aria-busy', 'true');
      cursor = null;
    }

    return window.BMApi.library(path, append ? cursor : null).then(function (data) {
      listEl.removeAttribute('aria-busy');

      if (data && data.unavailable) { show('a-offline'); return; }

      show('a-main');
      crumbs(path);
      render(data, append);
      if (!append) loadUploads(path);
    }).catch(function (err) {
      listEl.removeAttribute('aria-busy');
      show('a-main');
      crumbs(path);
      if (!append) listEl.textContent = '';
      msgEl.textContent = err && err.message
        ? err.message
        : (isIT() ? 'Non è stato possibile aprire la cartella.'
                  : 'That folder could not be opened.');
    });
  }

  function fromHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    /* Defence in depth: the route refuses these too, but a hash is the
       one part of this a person can type. */
    return h.split('/').filter(function (s) { return s && s !== '..'; }).join('/');
  }

  function go() {
    current = fromHash();
    load(current, false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    listEl = document.getElementById('a-list');
    crumbEl = document.getElementById('a-crumbs');
    msgEl = document.getElementById('a-msg');
    moreBtn = document.getElementById('a-more');
    upSec = document.getElementById('a-uploads');
    upList = document.getElementById('a-uploads-list');
    if (!listEl) return;

    moreBtn.addEventListener('click', function () { load(current, true); });
    window.addEventListener('hashchange', go);

    /* The dates and the folder/empty labels are language-dependent, so a
       toggle has to redraw rather than just restyle. */
    document.addEventListener('bm:lang', go);

    go();
  });
})();
