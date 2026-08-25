/* Minimal QR encoder — byte mode, EC level M, versions 1–6.
   Returns a boolean matrix. Enough for short membership URLs. */
(function (global) {
  'use strict';

  // [group1Blocks, g1DataCodewords, group2Blocks, g2DataCodewords, ecPerBlock]
  var RS = {
    1: [1, 16, 0, 0, 10],
    2: [1, 28, 0, 0, 16],
    3: [1, 44, 0, 0, 26],
    4: [2, 32, 0, 0, 18],
    5: [2, 43, 0, 0, 24],
    6: [4, 27, 0, 0, 16]
  };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };
  var FORMAT_M = [0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0];

  // Galois field GF(256), primitive 0x11D
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gmul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function ecPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gmul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function ecBytes(data, n) {
    var gen = ecPoly(n);
    var rem = data.slice().concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) {
      var f = rem[i];
      if (f === 0) continue;
      for (var j = 0; j < gen.length; j++) rem[i + j] ^= gmul(gen[j], f);
    }
    return rem.slice(data.length);
  }

  function utf8(str) {
    var out = [], s = encodeURIComponent(str);
    for (var i = 0; i < s.length; i++) {
      if (s[i] === '%') { out.push(parseInt(s.substr(i + 1, 2), 16)); i += 2; }
      else out.push(s.charCodeAt(i));
    }
    return out;
  }

  function pickVersion(len) {
    for (var v = 1; v <= 6; v++) {
      var r = RS[v];
      var cap = r[0] * r[1] + r[2] * r[3];
      var header = 4 + (v < 10 ? 8 : 16);
      if (len + Math.ceil(header / 8) <= cap) return v;
    }
    return null;
  }

  function buildData(bytes, version) {
    var r = RS[version];
    var totalData = r[0] * r[1] + r[2] * r[3];
    var bits = [];
    function push(val, n) {
      for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    push(4, 4);                 // byte mode
    push(bytes.length, 8);      // char count (versions 1–9)
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var cap = totalData * 8;
    for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);   // terminator
    while (bits.length % 8) bits.push(0);

    var cw = [];
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
      cw.push(v);
    }
    var pad = [0xEC, 0x11], p = 0;
    while (cw.length < totalData) cw.push(pad[p++ % 2]);

    // split into blocks
    var blocks = [], ecs = [], idx = 0, g;
    for (g = 0; g < r[0]; g++) { blocks.push(cw.slice(idx, idx + r[1])); idx += r[1]; }
    for (g = 0; g < r[2]; g++) { blocks.push(cw.slice(idx, idx + r[3])); idx += r[3]; }
    for (g = 0; g < blocks.length; g++) ecs.push(ecBytes(blocks[g], r[4]));

    // interleave
    var out = [], maxD = Math.max(r[1], r[3] || 0), i2, j2;
    for (i2 = 0; i2 < maxD; i2++)
      for (j2 = 0; j2 < blocks.length; j2++)
        if (i2 < blocks[j2].length) out.push(blocks[j2][i2]);
    for (i2 = 0; i2 < r[4]; i2++)
      for (j2 = 0; j2 < ecs.length; j2++) out.push(ecs[j2][i2]);

    return out;
  }

  function makeMatrix(version) {
    var size = version * 4 + 17;
    var m = [], res = [], i, j;
    for (i = 0; i < size; i++) {
      m.push(new Array(size).fill(null));
      res.push(new Array(size).fill(false));
    }

    function finder(r, c) {
      for (var dr = -1; dr <= 7; dr++)
        for (var dc = -1; dc <= 7; dc++) {
          var rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
          var on = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                   (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                   (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          m[rr][cc] = on; res[rr][cc] = true;
        }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    // timing
    for (i = 8; i < size - 8; i++) {
      m[6][i] = i % 2 === 0; res[6][i] = true;
      m[i][6] = i % 2 === 0; res[i][6] = true;
    }

    // alignment
    var ap = ALIGN[version];
    for (i = 0; i < ap.length; i++)
      for (j = 0; j < ap.length; j++) {
        var ar = ap[i], ac = ap[j];
        if (res[ar][ac]) continue;
        for (var y = -2; y <= 2; y++)
          for (var x = -2; x <= 2; x++) {
            m[ar + y][ac + x] =
              Math.max(Math.abs(y), Math.abs(x)) !== 1;
            res[ar + y][ac + x] = true;
          }
      }

    // dark module + format areas reserved
    m[size - 8][8] = true; res[size - 8][8] = true;
    for (i = 0; i < 9; i++) {
      if (!res[8][i]) { res[8][i] = true; m[8][i] = false; }
      if (!res[i][8]) { res[i][8] = true; m[i][8] = false; }
    }
    for (i = 0; i < 8; i++) {
      if (!res[8][size - 1 - i]) { res[8][size - 1 - i] = true; m[8][size - 1 - i] = false; }
      if (!res[size - 1 - i][8]) { res[size - 1 - i][8] = true; m[size - 1 - i][8] = false; }
    }

    return { m: m, res: res, size: size };
  }

  function placeData(ctx, codewords) {
    var m = ctx.m, res = ctx.res, size = ctx.size;
    var bits = [];
    for (var i = 0; i < codewords.length; i++)
      for (var b = 7; b >= 0; b--) bits.push((codewords[i] >> b) & 1);

    var idx = 0, up = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var r = 0; r < size; r++) {
        var row = up ? size - 1 - r : r;
        for (var c = 0; c < 2; c++) {
          var cc = col - c;
          if (res[row][cc]) continue;
          m[row][cc] = idx < bits.length ? bits[idx] === 1 : false;
          idx++;
        }
      }
      up = !up;
    }
  }

  function applyMask(ctx, mask) {
    var m = ctx.m, res = ctx.res, size = ctx.size;
    var out = [];
    for (var r = 0; r < size; r++) {
      out.push([]);
      for (var c = 0; c < size; c++) {
        var v = m[r][c];
        if (!res[r][c]) {
          var f;
          switch (mask) {
            case 0: f = (r + c) % 2 === 0; break;
            case 1: f = r % 2 === 0; break;
            case 2: f = c % 3 === 0; break;
            case 3: f = (r + c) % 3 === 0; break;
            case 4: f = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
            case 5: f = ((r * c) % 2) + ((r * c) % 3) === 0; break;
            case 6: f = ((((r * c) % 2) + ((r * c) % 3)) % 2) === 0; break;
            default: f = ((((r + c) % 2) + ((r * c) % 3)) % 2) === 0;
          }
          if (f) v = !v;
        }
        out[r].push(!!v);
      }
    }
    return out;
  }

  function placeFormat(grid, ctx, mask) {
    var size = ctx.size, fmt = FORMAT_M[mask], i;
    function bit(n) { return ((fmt >> n) & 1) === 1; }
    for (i = 0; i <= 5; i++) grid[8][i] = bit(14 - i);
    grid[8][7] = bit(8); grid[8][8] = bit(7); grid[7][8] = bit(6);
    for (i = 9; i <= 14; i++) grid[14 - i][8] = bit(14 - i);
    for (i = 0; i <= 7; i++) grid[size - 1 - i][8] = bit(i);
    for (i = 8; i <= 14; i++) grid[8][size - 15 + i] = bit(i);
    grid[size - 8][8] = true;
    return grid;
  }

  function penalty(g) {
    var n = g.length, p = 0, r, c, run, i;
    for (r = 0; r < n; r++) {
      run = 1;
      for (c = 1; c < n; c++) {
        if (g[r][c] === g[r][c - 1]) { run++; }
        else { if (run >= 5) p += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (c = 0; c < n; c++) {
      run = 1;
      for (r = 1; r < n; r++) {
        if (g[r][c] === g[r - 1][c]) { run++; }
        else { if (run >= 5) p += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (r = 0; r < n - 1; r++)
      for (c = 0; c < n - 1; c++)
        if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
    var dark = 0;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g[r][c]) dark++;
    var pct = (dark * 100) / (n * n);
    p += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return p;
  }

  function encode(text) {
    var bytes = utf8(text);
    var version = pickVersion(bytes.length);
    if (!version) throw new Error('QR: text too long');
    var cw = buildData(bytes, version);
    var ctx = makeMatrix(version);
    placeData(ctx, cw);

    var best = null, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var g = placeFormat(applyMask(ctx, mask), ctx, mask);
      var s = penalty(g);
      if (s < bestScore) { bestScore = s; best = g; }
    }
    return best;
  }

  /* Render into an element as crisp SVG */
  function render(el, text, opts) {
    opts = opts || {};
    var quiet = opts.quiet == null ? 4 : opts.quiet;
    var fg = opts.fg || '#000000';
    var bg = opts.bg || 'transparent';
    var g = encode(text);
    var n = g.length, dim = n + quiet * 2, d = '';
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++)
        if (g[r][c]) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';

    el.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" ' +
      'width="100%" height="100%" shape-rendering="crispEdges" role="img" ' +
      'aria-label="QR code">' +
      (bg !== 'transparent' ? '<rect width="' + dim + '" height="' + dim + '" fill="' + bg + '"/>' : '') +
      '<path d="' + d + '" fill="' + fg + '"/></svg>';
  }

  global.QR = { encode: encode, render: render };
})(this);
