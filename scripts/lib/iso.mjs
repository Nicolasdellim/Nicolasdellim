// Outils partagés : projection isométrique, couleurs, texte vectorisé.
// Les images d'un README GitHub ne chargent pas de webfonts : tout texte est
// converti en tracés pour un rendu identique partout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const C30 = Math.cos(Math.PI / 6);

export const r = (n) => Math.round(n * 100) / 100;

// Neutres calés sur la palette de GitHub pour que l'image se fonde dans la page.
export const THEMES = {
  dark: {
    name: 'dark', bg: '#0d1117',
    text: '#e6edf3', muted: '#8b949e', faint: '#484f58', line: '#30363d',
    chip: '#161b22',
    key: { top: '#1d232b', left: '#161b22', right: '#11151b' },
    base: { top: '#151a21', left: '#10141a', right: '#0b0e13' },
    edge: '#2d343e',
    empty: { top: '#1c2129', left: '#161a20', right: '#11151a' },
    shadow: 'rgba(0,0,0,0.5)',
    mono: { front: '#f5f5f4', side: '#9ca3af', back: '#4b5563' },
  },
  light: {
    name: 'light', bg: '#ffffff',
    text: '#1f2328', muted: '#656d76', faint: '#afb8c1', line: '#d0d7de',
    chip: '#f6f8fa',
    key: { top: '#ffffff', left: '#eef1f4', right: '#dfe4e9' },
    base: { top: '#f6f8fa', left: '#e5e9ee', right: '#d6dce2' },
    edge: '#d0d7de',
    empty: { top: '#eef1f4', left: '#e2e6eb', right: '#d5dae0' },
    shadow: 'rgba(31,35,40,0.13)',
    mono: { front: '#111111', side: '#3f3f46', back: '#71717a' },
  },
};

// Rampes d'accent : [dessus, face gauche, face droite], lumière en haut à gauche.
export const ACC = {
  violet: ['#a78bfa', '#8b5cf6', '#6d28d9'],
  cyan: ['#67e8f9', '#22d3ee', '#0e7490'],
  emerald: ['#6ee7b7', '#34d399', '#047857'],
  amber: ['#fcd34d', '#f59e0b', '#b45309'],
  rose: ['#fda4af', '#fb7185', '#be123c'],
  blue: ['#93c5fd', '#3b82f6', '#1d4ed8'],
};
export const faces = ([top, left, right]) => ({ top, left, right });

const hex2 = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function mix(a, b, t) {
  const A = hex2(a), B = hex2(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// Projection isométrique vraie (30°). x → bas-droite, y → bas-gauche, z → haut.
export function iso(s, ox, oy) {
  const p = (x, y, z = 0) => [ox + (x - y) * C30 * s, oy + (x + y) * 0.5 * s - z * s];
  const pts = (list) => list.map(([x, y, z]) => p(x, y, z).map(r).join(',')).join(' ');
  const mat = (a, b, c, d, [e, f]) => `matrix(${[a, b, c, d].map((v) => Math.round(v * 1e4) / 1e4).concat([r(e), r(f)]).join(' ')})`;
  // Plan quelconque : u local → vecteur monde U, v local → vecteur monde V.
  const plane = (x, y, z, U, V, k = 1) => {
    const d = ([dx, dy, dz]) => [(dx - dy) * C30 * s * k, ((dx + dy) * 0.5 - dz) * s * k];
    const [a, b] = d(U), [c, e] = d(V);
    return mat(a, b, c, e, p(x, y, z));
  };
  return {
    s, p, pts, plane,
    top: (x, y, z, k = 1) => plane(x, y, z, [1, 0, 0], [0, 1, 0], k),
    front: (x, y, z, k = 1) => plane(x, y, z, [1, 0, 0], [0, 0, -1], k), // face +y
    side: (x, y, z, k = 1) => plane(x, y, z, [0, -1, 0], [0, 0, -1], k), // face +x
  };
}

export function box(I, { x, y, z = 0, w, d, h }, f, { stroke, sw = 1, topExtra = '' } = {}) {
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
  const T = I.pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const L = I.pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const R = I.pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]);
  return `<polygon points="${L}" fill="${f.left}"${st}/><polygon points="${R}" fill="${f.right}"${st}/><polygon points="${T}" fill="${f.top}"${st}${topExtra}/>`;
}
export const quad = (I, { x, y, z = 0, w, d }, attrs) =>
  `<polygon points="${I.pts([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])}" ${attrs}/>`;
export const line = (I, a, b, attrs) => { const A = I.p(...a), B = I.p(...b); return `<path d="M${r(A[0])} ${r(A[1])}L${r(B[0])} ${r(B[1])}" ${attrs}/>`; };

// ---------------------------------------------------------------- Texte
const FILES = { sans: 'Switzer-Semibold.otf', medium: 'Switzer-Medium.otf', regular: 'Switzer-Regular.otf', mono: 'FragmentMono-Regular.ttf' };
const cache = {};
export function font(name) {
  if (!cache[name]) {
    const buf = fs.readFileSync(path.join(here, '..', 'fonts', FILES[name]));
    cache[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return cache[name];
}
function pd(p) {
  const n = (v) => String(r(v));
  return p.commands.map((c) => {
    if (c.type === 'M' || c.type === 'L') return c.type + n(c.x) + ' ' + n(c.y);
    if (c.type === 'Q') return 'Q' + [c.x1, c.y1, c.x, c.y].map(n).join(' ');
    if (c.type === 'C') return 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(n).join(' ');
    return 'Z';
  }).join('');
}
const glyphs = (f, s) => Array.from(s).map((ch) => f.charToGlyph(ch));
export function measure(fn, str, size, tracking = 0) {
  const f = font(fn), g = glyphs(f, str), k = size / f.unitsPerEm;
  return g.reduce((w, gl, i) => w + gl.advanceWidth * k + (i < g.length - 1 ? f.getKerningValue(gl, g[i + 1]) * k + tracking : 0), 0);
}
export function textD(fn, str, x, y, size, { anchor = 'start', tracking = 0 } = {}) {
  const f = font(fn), g = glyphs(f, str), k = size / f.unitsPerEm;
  const w = measure(fn, str, size, tracking);
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  let d = '';
  g.forEach((gl, i) => {
    d += pd(gl.getPath(cx, y, size));
    cx += gl.advanceWidth * k + (i < g.length - 1 ? f.getKerningValue(gl, g[i + 1]) * k + tracking : 0);
  });
  return d;
}
export const text = (fn, str, x, y, size, { fill = 'currentColor', attrs = '', ...o } = {}) =>
  `<path d="${textD(fn, str, x, y, size, o)}" fill="${fill}"${attrs ? ' ' + attrs : ''}/>`;

export function svgDoc({ width, height, title, desc, style = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-labelledby="t d">
<title id="t">${title}</title>
<desc id="d">${desc}</desc>
<style>${style}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }</style>
<defs>${defs}</defs>
${body}
</svg>
`;
}
