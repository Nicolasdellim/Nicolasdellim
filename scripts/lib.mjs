// Outils communs : thèmes, texte Switzer vectorisé, gabarit SVG, grille.
// Les images d'un README ne chargent pas de webfonts : le texte devient des tracés.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Toutes les images font 1200 de large (ou un tiers) : même échelle partout,
// donc les filets se raccordent d'une image à l'autre.
export const W = 1200;
export const M = 48;          // marge intérieure
export const COL = 300;       // début de la colonne de contenu
export const HAIR = 1.4;      // ≈ 1 px une fois l'image réduite par GitHub

export const THEMES = {
  light: { ink: '#0A0A0A', sub: '#8A8A8A', rule: '#E4E4E2', dot0: '#EDEDEB', live: '#22C55E', pill: '#FFFFFF' },
  dark: { ink: '#F5F5F4', sub: '#8B8B8B', rule: '#2A2E35', dot0: '#1B1F25', live: '#22C55E', pill: '#11151B' },
};

const FILES = { semibold: 'Switzer-Semibold.otf', medium: 'Switzer-Medium.otf', regular: 'Switzer-Regular.otf' };
const cache = {};
const font = (n) => (cache[n] ??= opentype.loadSync(path.join(here, 'fonts', FILES[n])));
export const r = (n) => Math.round(n * 100) / 100;

function pathData(p) {
  const n = (v) => String(r(v));
  return p.commands.map((c) =>
    c.type === 'M' || c.type === 'L' ? c.type + n(c.x) + ' ' + n(c.y)
      : c.type === 'Q' ? 'Q' + [c.x1, c.y1, c.x, c.y].map(n).join(' ')
        : c.type === 'C' ? 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(n).join(' ') : 'Z').join('');
}
const glyphs = (F, s) => Array.from(s).map((c) => F.charToGlyph(c));

export function width(f, s, size, tr = 0) {
  const F = font(f), g = glyphs(F, s), k = size / F.unitsPerEm;
  return g.reduce((w, gl, i) => w + gl.advanceWidth * k + (i < g.length - 1 ? F.getKerningValue(gl, g[i + 1]) * k + tr : 0), 0);
}
export function text(f, s, x, y, size, fill, { tr = 0, anchor = 'start', cls = '' } = {}) {
  const F = font(f), g = glyphs(F, s), k = size / F.unitsPerEm;
  let cx = anchor === 'end' ? x - width(f, s, size, tr) : x, out = '';
  g.forEach((gl, i) => {
    out += pathData(gl.getPath(cx, y, size));
    cx += gl.advanceWidth * k + (i < g.length - 1 ? F.getKerningValue(gl, g[i + 1]) * k + tr : 0);
  });
  return `<path${cls ? ` class="${cls}"` : ''} d="${out}" fill="${fill}"/>`;
}

// Flèche ↗ dessinée (même graisse que le texte medium).
export const arrow = (x, y, size, color) => {
  const s = size * 0.42;
  return `<path d="M${r(x)} ${r(y)} L${r(x + s)} ${r(y - s)} M${r(x + s * 0.25)} ${r(y - s)} H${r(x + s)} V${r(y - s * 0.25)}" stroke="${color}" stroke-width="${r(size * 0.085)}" fill="none"/>`;
};

// Filets : verticales aux bords (comme sur vision-studio.be), horizontales entre bandes.
export const vline = (x, y1, y2, c) => `<rect x="${r(x - HAIR / 2)}" y="${y1}" width="${HAIR}" height="${y2 - y1}" fill="${c}"/>`;
export const hline = (y, x1, x2, c) => `<rect x="${x1}" y="${r(y - HAIR / 2)}" width="${x2 - x1}" height="${HAIR}" fill="${c}"/>`;

export const esc = (s) => s.replace(/&/g, '&amp;');
export function doc({ w = W, h, title, desc, style = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>
.in { animation: in 1.1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }${style}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
</style>
${body}
</svg>
`;
}
