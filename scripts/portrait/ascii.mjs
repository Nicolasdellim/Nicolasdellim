// Portrait ASCII, généré une fois en local à partir d'une photo (non versionnée).
//
//   swiftc -O mask.swift -o /tmp/mask && /tmp/mask photo.jpg masque.png   (détourage, framework Vision)
//   sips -z 319 336 -s format bmp photo.jpg  --out photo.bmp      (photo recadrée sur le visage, ~1:1)
//   sips -z 319 336 -s format bmp masque.png --out masque.bmp
//   node ascii.mjs photo.bmp masque.bmp > ../portrait.json
//
// Méthode : photo accentuée (masque flou), contraste normalisé sur le sujet, puis pour
// chaque cellule un caractère choisi selon sa densité d'encre réelle dans Fragment Mono
// et un niveau d'opacité (4 crans). Le buste s'estompe vers le bas, la silhouette est
// soulignée par des traits orientés.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const COLS = 84, ROWS = 58;

function readBmp(file) {
  const b = fs.readFileSync(file);
  const off = b.readUInt32LE(10), w = b.readInt32LE(18), h0 = b.readInt32LE(22), h = Math.abs(h0), bpp = b.readUInt16LE(28) / 8;
  const rs = Math.ceil((w * bpp) / 4) * 4, g = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const yy = h0 < 0 ? y : h - 1 - y;
    for (let x = 0; x < w; x++) { const i = off + yy * rs + x * bpp; g[y * w + x] = (0.0722 * b[i] + 0.7152 * b[i + 1] + 0.2126 * b[i + 2]) / 255; }
  }
  return { w, h, g };
}

// Densité d'encre de chaque caractère (aire du glyphe / aire de la cellule).
function coverageRamp() {
  const F = opentype.loadSync(path.join(here, '..', 'fonts', 'FragmentMono-Regular.ttf'));
  const chars = Array.from(" .`',:;-_~^\"!|/\\()[]{}<>=+*icrlvxtfjnuozsaeyhkbdpqgwmXYZJLCUOQ0#%&@$NMW8B");
  const cell = F.charToGlyph('M').advanceWidth * F.unitsPerEm * 1.05;
  const area = (ch) => {
    const cmds = F.charToGlyph(ch).getPath(0, 0, F.unitsPerEm).commands;
    let a = 0, sx = 0, sy = 0, px = 0, py = 0;
    const seg = (x, y) => { a += px * y - x * py; px = x; py = y; };
    for (const c of cmds) {
      if (c.type === 'M') { sx = px = c.x; sy = py = c.y; }
      else if (c.type === 'L') seg(c.x, c.y);
      else if (c.type === 'Q') { const x0 = px, y0 = py; for (let t = 0.125; t <= 1.001; t += 0.125) { const u = 1 - t; seg(u * u * x0 + 2 * u * t * c.x1 + t * t * c.x, u * u * y0 + 2 * u * t * c.y1 + t * t * c.y); } }
      else if (c.type === 'C') { const x0 = px, y0 = py; for (let t = 0.125; t <= 1.001; t += 0.125) { const u = 1 - t; seg(u ** 3 * x0 + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x, u ** 3 * y0 + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y); } }
      else if (c.type === 'Z') seg(sx, sy);
    }
    return Math.abs(a / 2) / cell;
  };
  const list = chars.map((ch) => [ch, ch === ' ' ? 0 : area(ch)]).sort((a, b) => a[1] - b[1]);
  const max = list[list.length - 1][1];
  // Échelle régulière : un caractère par cran de densité.
  const steps = 22, ramp = [];
  for (let i = 0; i < steps; i++) {
    const target = (i / (steps - 1)) * max;
    let best = list[0];
    for (const it of list) if (Math.abs(it[1] - target) < Math.abs(best[1] - target)) best = it;
    if (!ramp.includes(best[0])) ramp.push(best[0]);
  }
  return ramp;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function portrait(photoBmp, maskBmp, dark) {
  const P = readBmp(photoBmp), K = readBmp(maskBmp);
  const { w, h } = P;
  const at = (A, x, y) => A[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const blur = (A, rad) => {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * rad + 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -rad; i <= rad; i++) s += at(A, x + i, y); tmp[y * w + x] = s / n; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = -rad; j <= rad; j++) s += at(tmp, x, y + j); out[y * w + x] = s / n; }
    return out;
  };
  // Accentuation (masque flou) pour faire ressortir yeux, sourcils, bouche.
  const soft = blur(P.g, 3);
  const g = P.g.map((v, i) => v + 1.1 * (v - soft[i]));

  const bx = w / COLS, by = h / ROWS, cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let t = 0, m = 0, n = 0, mgx = 0, mgy = 0;
    for (let y = Math.floor(r * by); y < Math.floor((r + 1) * by); y++) for (let x = Math.floor(c * bx); x < Math.floor((c + 1) * bx); x++) {
      t += g[y * w + x]; m += K.g[y * w + x]; n++;
      mgx += at(K.g, x + 1, y) - at(K.g, x - 1, y); mgy += at(K.g, x, y + 1) - at(K.g, x, y - 1);
    }
    cells.push({ r, c, t: t / n, m: m / n, ex: mgx / n, ey: mgy / n });
  }
  const inside = cells.filter((k) => k.m > 0.6).map((k) => (dark ? k.t : 1 - k.t)).sort((a, b) => a - b);
  const lo = inside[Math.floor(inside.length * 0.04)], hi = inside[Math.floor(inside.length * 0.985)];
  const ramp = coverageRamp();

  const chars = [], levels = [];
  for (let r = 0; r < ROWS; r++) {
    let line = '', lv = '';
    for (let c = 0; c < COLS; c++) {
      const k = cells[r * COLS + c];
      const y = r / ROWS;
      const fade = 1 - 0.78 * smooth(0.74, 1, y);           // le buste s'estompe
      const em = Math.hypot(k.ex, k.ey) * 2.2;                 // bord de la silhouette
      if (em > 0.5 && r < ROWS - 1 && c > 0 && c < COLS - 1 && y < 0.9) {
        let a = Math.atan2(k.ey, k.ex) + Math.PI / 2; a = ((a % Math.PI) + Math.PI) % Math.PI; const d = (a * 180) / Math.PI;
        line += d < 22.5 || d >= 157.5 ? '-' : d < 67.5 ? '\\' : d < 112.5 ? '|' : '/';
        lv += '2';
        continue;
      }
      if (k.m < 0.35) { line += ' '; lv += '0'; continue; }
      let t = Math.min(1, Math.max(0, ((dark ? k.t : 1 - k.t) - lo) / (hi - lo)));
      t = Math.pow(t, dark ? 0.85 : 1.05) * fade * Math.min(1, k.m * 1.3);
      const ch = ramp[Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1)))];
      line += ch;
      lv += ch === ' ' ? '0' : String(t < 0.18 ? 1 : t < 0.4 ? 2 : t < 0.65 ? 3 : 4);
    }
    chars.push(line); levels.push(lv);
  }
  return { chars, levels };
}

if (process.argv[2]) {
  const [photo, mask, mode] = process.argv.slice(2);
  if (mode === 'preview') for (const d of [false, true]) console.log(portrait(photo, mask, d).chars.join('\n') + '\n');
  else process.stdout.write(JSON.stringify({ cols: COLS, rows: ROWS, light: portrait(photo, mask, false), dark: portrait(photo, mask, true) }) + '\n');
}
