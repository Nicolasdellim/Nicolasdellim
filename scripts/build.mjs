// Génère les SVG du README dans la DA Vision Studio :
// noir et blanc, Switzer seule, fer à gauche, la fenêtre ( ) comme seul effet.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- Thèmes
const THEMES = {
  light: { ink: '#000000', sub: '#767676', rule: '#BDBDBA' },
  dark: { ink: '#FFFFFF', sub: '#8C8C8C', rule: '#3A3A38' },
};

// ---------------------------------------------------------------- Symbole ( )
// Géométrie officielle (brand/src/geometry.json) : cadre 843 × 478.
const SYM_W = 843, SYM_H = 478;
const PAREN = 'M78.52 0A403 403 0 0 0 78.52 478L217.63 478A328.5 328.5 0 0 1 217.63 0Z';
const WINDOW = 'M217.63 0A328.5 328.5 0 0 0 217.63 478L625.37 478A328.5 328.5 0 0 0 625.37 0Z';

// ---------------------------------------------------------------- Texte → tracés
const FONTS = { semibold: 'Switzer-Semibold.otf', medium: 'Switzer-Medium.otf', regular: 'Switzer-Regular.otf' };
const cache = {};
const font = (n) => (cache[n] ??= opentype.loadSync(path.join(here, 'fonts', FONTS[n])));
const r = (n) => Math.round(n * 100) / 100;
function d(p) {
  const n = (v) => String(r(v));
  return p.commands.map((c) =>
    c.type === 'M' || c.type === 'L' ? c.type + n(c.x) + ' ' + n(c.y)
      : c.type === 'Q' ? 'Q' + [c.x1, c.y1, c.x, c.y].map(n).join(' ')
        : c.type === 'C' ? 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(n).join(' ') : 'Z').join('');
}
function width(f, s, size, tr = 0) {
  const F = font(f), g = Array.from(s).map((c) => F.charToGlyph(c)), k = size / F.unitsPerEm;
  return g.reduce((w, gl, i) => w + gl.advanceWidth * k + (i < g.length - 1 ? F.getKerningValue(gl, g[i + 1]) * k + tr : 0), 0);
}
function text(f, s, x, y, size, fill, tr = 0) {
  const F = font(f), g = Array.from(s).map((c) => F.charToGlyph(c)), k = size / F.unitsPerEm;
  let cx = x, out = '';
  g.forEach((gl, i) => {
    out += d(gl.getPath(cx, y, size));
    cx += gl.advanceWidth * k + (i < g.length - 1 ? F.getKerningValue(gl, g[i + 1]) * k + tr : 0);
  });
  return `<path d="${out}" fill="${fill}"/>`;
}
const img = (name) => `data:image/jpeg;base64,${fs.readFileSync(path.join(here, 'images', name)).toString('base64')}`;
const esc = (s) => s.replace(/&/g, '&amp;');

function doc({ w, h, title, desc, style = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${style}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }</style>
${body}
</svg>
`;
}

// Fenêtre ( ) : image entre les deux parenthèses, cadre posé en x, y, largeur w.
function windowed(id, x, y, w, ink, href, { open = false } = {}) {
  const k = w / SYM_W;
  return `<clipPath id="${id}"><path d="${WINDOW}"/></clipPath>
<g transform="translate(${r(x)} ${r(y)}) scale(${r(k * 1e4) / 1e4})">
  <g${open ? ' class="reveal"' : ''}><image href="${href}" x="100" y="0" width="643" height="${SYM_H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/></g>
  <g${open ? ' class="pl"' : ''}><path d="${PAREN}" fill="${ink}"/></g>
  <g${open ? ' class="pr"' : ''}><path transform="translate(${SYM_W} 0) scale(-1 1)" d="${PAREN}" fill="${ink}"/></g>
</g>`;
}

// ---------------------------------------------------------------- Bannière
function hero(theme) {
  const T = THEMES[theme];
  const W = 1200, H = 520, X = 64;
  const logo = fs.readFileSync(path.join(here, 'images', 'vs-mot-symbole-noir.svg'), 'utf8').match(/ d="([^"]+)"/g).map((m) => m.slice(4, -1));
  const lk = 22 / 214; // hauteur de capitale du logo : 22 px
  const body = [
    `<g transform="translate(${X} 64) scale(${r(lk * 1e4) / 1e4})">${logo.map((p) => `<path d="${p}" fill="${T.ink}"/>`).join('')}</g>`,
    text('semibold', 'Nicolas', X - 4, 300, 96, T.ink, -3),
    text('semibold', 'Delli Muti', X - 4, 392, 96, T.ink, -3),
    text('regular', 'Designer web et graphique, fondateur de Vision Studio.', X, 446, 22, T.sub),
    text('regular', 'Mons, Belgique.', X, 476, 22, T.sub),
    windowed('wp', 640, 140, 496, T.ink, img('portrait.jpg'), { open: true }),
  ];
  return doc({
    w: W, h: H, title: 'Nicolas Delli Muti',
    desc: 'Nicolas Delli Muti, designer web et graphique, fondateur de Vision Studio, à Mons en Belgique. Son portrait apparaît dans la fenêtre du symbole ( ) de Vision Studio.',
    style: `
.pl { animation: pl 1.4s cubic-bezier(.7,0,.2,1) both; }
.pr { animation: pr 1.4s cubic-bezier(.7,0,.2,1) both; }
.reveal { animation: reveal 1.4s cubic-bezier(.7,0,.2,1) both; }
@keyframes pl { from { transform: translateX(260px); } to { transform: none; } }
@keyframes pr { from { transform: translateX(-260px); } to { transform: none; } }
@keyframes reveal { 0%, 35% { opacity: 0; } 100% { opacity: 1; } }`,
    body: body.join('\n'),
  });
}

// ---------------------------------------------------------------- Projets
const PROJECTS = [
  { file: 'bisson.jpg', name: 'Lucas Bisson', what: 'Portfolio d’architecte' },
  { file: 'brute.jpg', name: 'Brut.e', what: 'Site de podcast' },
  { file: 'shopsnkrs.jpg', name: 'ShopSnkrs', what: 'Boutique de sneakers' },
];
function projects(theme) {
  const T = THEMES[theme];
  const W = 1200, X = 64, G = 24;
  const cw = (W - 2 * X - 2 * G) / 3, ch = cw * (SYM_H / SYM_W);
  const top = 112;
  const body = [text('semibold', 'Projets', X - 2, 72, 40, T.ink, -1)];
  PROJECTS.forEach((p, i) => {
    const x = X + i * (cw + G);
    body.push(windowed(`w${i}`, x, top, cw, T.ink, img(p.file)));
    body.push(text('medium', p.name, x, top + ch + 44, 22, T.ink));
    body.push(text('regular', p.what, x, top + ch + 72, 18, T.sub));
  });
  return doc({
    w: W, h: Math.ceil(top + ch + 96), title: 'Projets',
    desc: `Projets réalisés avec Vision Studio : ${PROJECTS.map((p) => `${p.name}, ${p.what.toLowerCase()}`).join(' ; ')}.`,
    body: body.join('\n'),
  });
}

// ---------------------------------------------------------------- Outils
const TOOLS = [
  ['Design', ['Figma', 'Framer', 'Webflow', 'Canva']],
  ['Développement', ['Next.js', 'Tailwind CSS', 'Supabase', 'Vercel']],
  ['IA', ['Claude', 'ChatGPT', 'Cursor', 'Gemini']],
];
function tools(theme) {
  const T = THEMES[theme];
  const W = 1200, X = 64, cw = (W - 2 * X) / 3;
  const body = [text('semibold', 'Outils', X - 2, 72, 40, T.ink, -1), `<rect x="${X}" y="104" width="${W - 2 * X}" height="1" fill="${T.rule}"/>`];
  TOOLS.forEach(([label, items], i) => {
    const x = X + i * cw;
    body.push(text('regular', label, x, 144, 18, T.sub));
    items.forEach((it, j) => body.push(text('medium', it, x, 184 + j * 32, 22, T.ink)));
  });
  return doc({
    w: W, h: 184 + 3 * 32 + 36, title: 'Outils',
    desc: TOOLS.map(([l, it]) => `${l} : ${it.join(', ')}`).join('. ') + '.',
    body: body.join('\n'),
  });
}

// ---------------------------------------------------------------- Liens (une image par lien)
const LINKS = [
  { id: 'site', label: 'vision-studio.be' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'email', label: 'Email' },
];
// Même échelle que les grandes images (1200 de large) ; le premier lien
// porte la marge de 64 pour s'aligner sur le texte au-dessus.
function link(l, theme, first) {
  const T = THEMES[theme];
  const S = 26, x0 = first ? 64 : 0, ax = x0 + width('medium', l.label, S) + 14;
  return doc({
    w: Math.ceil(ax + 22), h: 40, title: l.label, desc: `Lien : ${l.label}`,
    body: `${text('medium', l.label, x0, 29, S, T.ink)}
<path d="M${r(ax)} 28 L${r(ax + 13)} 15 M${r(ax + 3)} 15 H${r(ax + 13)} V25" stroke="${T.ink}" stroke-width="2.2" fill="none"/>`,
  });
}

for (const theme of ['light', 'dark']) {
  const files = { [`hero-${theme}.svg`]: hero(theme), [`projets-${theme}.svg`]: projects(theme), [`outils-${theme}.svg`]: tools(theme) };
  LINKS.forEach((l, i) => (files[`lien-${l.id}-${theme}.svg`] = link(l, theme, i === 0)));
  for (const [n, svg] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, n), svg);
    console.log(`${n.padEnd(26)} ${(svg.length / 1024).toFixed(1)} kB`);
  }
}
