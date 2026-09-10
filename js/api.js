/* ============================================================
   Small client for the /api/* Functions.
   ------------------------------------------------------------
   Everything here has to survive the API not existing at all:
   while the site is on GitHub Pages there are no Functions, so
   /api/* returns the 404 page. That is a normal state, not an
   error to shout about — call() reports it as `unavailable` and
   the pages show a quiet "not switched on yet" panel.
   ============================================================ */
(function () {
  'use strict';

  var BASE = '/api';

  function isJSON(res) {
    return (res.headers.get('content-type') || '').indexOf('application/json') !== -1;
  }

  function call(path, options) {
    var opts = options || {};
    return fetch(BASE + path, {
      method: opts.method || 'GET',
      credentials: 'same-origin',
      headers: opts.body ? { 'content-type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (!isJSON(res)) {
        /* An HTML body means no Function answered — the static 404. */
        return { unavailable: true, status: res.status };
      }
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || 'Request failed.');
          err.status = res.status;
          throw err;
        }
        return data;
      });
    }, function () {
      return { unavailable: true, status: 0 };
    });
  }

  /* Upload needs XHR: fetch cannot report progress on the request
     body, and these are phone photos and video over mobile data. */
  function upload(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', BASE + '/upload', true);
      xhr.withCredentials = true;
      xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name).replace(/%20/g, '_'));

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
      }

      xhr.onload = function () {
        var type = xhr.getResponseHeader('content-type') || '';
        if (type.indexOf('application/json') === -1) {
          resolve({ unavailable: true, status: xhr.status });
          return;
        }
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else {
          var err = new Error(data.error || 'Upload failed.');
          err.status = xhr.status;
          reject(err);
        }
      };
      xhr.onerror = function () { reject(new Error('The upload lost its connection.')); };
      xhr.send(file);
    });
  }

  window.BMApi = {
    list: function (status) { return call('/submissions' + (status ? '?status=' + status : '')); },
    create: function (body) { return call('/submissions', { method: 'POST', body: body }); },
    review: function (id, body) { return call('/submissions/' + id, { method: 'PATCH', body: body }); },
    remove: function (id) { return call('/submissions/' + id, { method: 'DELETE' }); },
    mediaURL: function (key) { return BASE + '/media/' + key; },
    upload: upload
  };
})();
