// Portrait ASCII généré une fois en local à partir d'une photo (non versionnée).
//   swiftc -O mask.swift -o /tmp/mask && /tmp/mask photo.jpg masque.png   (détourage, framework Vision)
//   sips -z 220 320 -s format bmp photo.jpg --out photo.bmp
//   sips -z 220 320 -s format bmp masque.png --out masque.bmp
//   node ascii.mjs photo.bmp masque.bmp json > ../portrait.json
import fs from 'node:fs';
function readBmp(file) {
  const b = fs.readFileSync(file);
  const off = b.readUInt32LE(10), w = b.readInt32LE(18), h0 = b.readInt32LE(22), h = Math.abs(h0), bpp = b.readUInt16LE(28) / 8;
  const rs = Math.ceil((w * bpp) / 4) * 4, g = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { const yy = h0 < 0 ? y : h - 1 - y;
    for (let x = 0; x < w; x++) { const i = off + yy * rs + x * bpp; g[y * w + x] = (0.0722 * b[i] + 0.7152 * b[i + 1] + 0.2126 * b[i + 2]) / 255; } }
  return { w, h, g };
}
// Portrait ASCII : ombrage (ton) + traits (contours orientés), sujet détouré.
export function asciiPortrait(photoBmp, maskBmp, cols, rows, { dark = false, ramp = ' .:-=+*#', edgeT = 0.3, outline = false } = {}) {
  const P = readBmp(photoBmp), Mk = readBmp(maskBmp);
  const { w, h } = P;
  const get = (A, x, y) => A[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  // Photo floutée, fond remplacé par la couleur de page (blanc en clair, noir en sombre).
  const src = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) src[i] = P.g[i] * Mk.g[i] + (dark ? 0 : 1) * (1 - Mk.g[i]);
  const bl = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += get(src, x + i, y + j); bl[y * w + x] = s / 9; }
  const bx = w / cols, by = h / rows, cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let gx = 0, gy = 0, mag = 0, tone = 0, m = 0, n = 0;
    for (let y = Math.floor(r * by); y < Math.floor((r + 1) * by); y++) for (let x = Math.floor(c * bx); x < Math.floor((c + 1) * bx); x++) {
      const S = (A) => [get(A, x + 1, y - 1) + 2 * get(A, x + 1, y) + get(A, x + 1, y + 1) - get(A, x - 1, y - 1) - 2 * get(A, x - 1, y) - get(A, x - 1, y + 1),
        get(A, x - 1, y + 1) + 2 * get(A, x, y + 1) + get(A, x + 1, y + 1) - get(A, x - 1, y - 1) - 2 * get(A, x, y - 1) - get(A, x + 1, y - 1)];
      let [sx, sy] = outline ? [0, 0] : S(bl); const [mx, my] = S(Mk.g); sx += mx * (outline ? 1 : 0.6); sy += my * (outline ? 1 : 0.6);
      const mg = Math.hypot(sx, sy), a = Math.atan2(sy, sx);
      gx += mg * Math.cos(2 * a); gy += mg * Math.sin(2 * a); mag += mg; tone += P.g[y * w + x]; m += Mk.g[y * w + x]; n++;
    }
    cells.push({ r, c, mag: mag / n, ang: Math.atan2(gy, gx) / 2, coh: Math.hypot(gx, gy) / (mag || 1), tone: tone / n, m: m / n });
  }
  const inside = cells.filter((k) => k.m > 0.5);
  const mags = inside.map((k) => k.mag).sort((a, b) => a - b); const M95 = mags[Math.floor(mags.length * 0.97)] || 1;
  const tones = inside.filter((k) => k.r < rows * 0.58).map((k) => (dark ? k.tone : 1 - k.tone)).sort((a, b) => a - b);
  const lo = tones[Math.floor(tones.length * 0.03)], hi = tones[Math.floor(tones.length * 0.97)];
  const out = Array.from({ length: rows }, () => Array(cols).fill(' '));
  for (const k of cells) {
    const e = k.mag / M95;
    if (k.m < 0.08 && e < edgeT) continue;
    let ch;
    const border = k.r === rows - 1 || k.c === 0 || k.c === cols - 1; // bord du cadre, pas un contour
    if (e > edgeT && k.coh > 0.3 && !border) {
      let a = k.ang + Math.PI / 2; a = ((a % Math.PI) + Math.PI) % Math.PI; const deg = (a * 180) / Math.PI;
      ch = deg < 22.5 || deg >= 157.5 ? '-' : deg < 67.5 ? '\\' : deg < 112.5 ? '|' : '/';
    } else {
      // égalisation d'histogramme : rang du ton parmi les cellules du sujet
      const v = dark ? k.tone : 1 - k.tone;
      let lo2 = 0, hi2 = tones.length; while (lo2 < hi2) { const md = (lo2 + hi2) >> 1; if (tones[md] < v) lo2 = md + 1; else hi2 = md; }
      const body = k.r > rows * 0.6 ? 0.55 : 1; // le buste plus léger : le visage reste le point focal
      const t = (lo2 / tones.length) * Math.min(1, k.m * 1.2) * body;
      ch = ramp[Math.min(ramp.length - 1, Math.floor(Math.pow(t, 1.1) * ramp.length))];
    }
    out[k.r][k.c] = ch;
  }
  return out.map((r) => r.join(''));
}
const RAMP = " .'`^,:;Il!i><~+_-?][}{1)(|tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
export const OPTS = { outline: true, ramp: RAMP, edgeT: 0.25 };
if (process.argv[2] && process.argv[4] !== 'json') { const C = +process.argv[4] || 64, R = +process.argv[5] || 44; for (const dark of [false, true]) console.log(asciiPortrait(process.argv[2], process.argv[3], C, R, { dark, outline: true, ramp: " .'`^,:;Il!i><~+_-?][}{1)(|tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$".slice(0, 70), edgeT: 0.25 }).join('\n') + '\n'); }

// node ascii.mjs photo.bmp masque.bmp json > ../portrait.json
if (process.argv[4] === 'json') {
  const [photo, mask] = process.argv.slice(2);
  process.stdout.write(JSON.stringify({ cols: 84, rows: 58, light: asciiPortrait(photo, mask, 84, 58, OPTS), dark: asciiPortrait(photo, mask, 84, 58, { ...OPTS, dark: true }) }, null, 1) + '\n');
}
