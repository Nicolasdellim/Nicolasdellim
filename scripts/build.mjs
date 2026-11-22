// Génère les SVG statiques de /assets : la page d'intro (titre, portrait, studio,
// parcours, architecture) et la rangée de liens.
// DA de vision-studio.be : fond clair, filets fins, titre en deux tons, Switzer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, M, COL, THEMES, text, width, arrow, vline, hline, doc, r } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const img = (name) => `data:image/jpeg;base64,${fs.readFileSync(path.join(HERE, 'images', name)).toString('base64')}`;

// Dessin axonométrique au trait (lignes cachées masquées par la couleur de fond).
function axo(T, ox, oy, s) {
  const C = Math.cos(Math.PI / 6);
  const p = (x, y, z) => [ox + (x - y) * C * s, oy + (x + y) * 0.5 * s - z * s];
  const pts = (l) => l.map(([x, y, z]) => p(x, y, z).map(r).join(',')).join(' ');
  const out = [];
  let k = 0;
  const stroke = (attrs, d) => out.push(`<${d} pathLength="1" class="draw" style="animation-delay:${r(0.9 + (k++) * 0.07)}s" ${attrs}/>`);
  // Sol : trame fine.
  const g = [];
  for (let i = 0; i <= 8; i++) {
    const a = p(i, 0, 0), b = p(i, 8, 0), c = p(0, i, 0), d = p(8, i, 0);
    g.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}M${r(c[0])} ${r(c[1])}L${r(d[0])} ${r(d[1])}`);
  }
  out.push(`<path d="${g.join('')}" stroke="${T.rule}" stroke-width="1"/>`);
  const block = (x, y, z, w, d, h, floors = 0) => {
    const top = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
    const left = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
    const right = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    for (const f of [left, right, top]) stroke(`points="${pts(f)}" fill="${T.bg}" stroke="${T.ink}" stroke-width="1.3" stroke-linejoin="round"`, 'polygon');
    if (floors) {
      const l = [];
      for (let i = 1; i < floors; i++) {
        const zz = z + (h * i) / floors;
        const a = p(x, y + d, zz), b = p(x + w, y + d, zz), c = p(x + w, y, zz);
        l.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}L${r(c[0])} ${r(c[1])}`);
      }
      stroke(`d="${l.join('')}" stroke="${T.sub}" stroke-width="0.9" fill="none"`, 'path');
    }
  };
  block(4.6, 0.8, 0, 2.4, 3.4, 2, 3);     // aile basse, derrière
  block(1.2, 1.2, 0, 3, 3, 6.2, 12);      // tour
  block(1.7, 1.7, 6.2, 2, 2, 1.6, 3);     // retrait
  block(2.3, 2.3, 7.8, 0.8, 0.8, 0.9);    // couronnement
  const a = p(2.7, 2.7, 8.7), b = p(2.7, 2.7, 10.2);
  stroke(`d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}" stroke="${T.ink}" stroke-width="1.3"`, 'path');
  block(1.6, 4.9, 0, 4.6, 1.6, 1.1, 2);   // socle devant
  return out.join('\n');
}

function intro(theme) {
  const T = THEMES[theme];
  const H = 1090;
  const b = [];
  const PX = 836; // début de la cellule photo
  b.push(vline(1, 0, H, T.rule), vline(W - 1, 0, H, T.rule), hline(1, 0, W, T.rule));
  const d = (t) => `style="animation-delay:${r(t)}s"`;

  // ---- Bande du haut
  b.push(`<g class="in">${text('medium', 'Nicolas Delli Muti', M, 46, 18, T.ink)}</g>`);
  const pill = 'Étudiant en informatique · Mons';
  const pw = width('medium', pill, 14) + 44, px = W - M - pw;
  b.push(`<g class="in" ${d(0.08)}><rect x="${r(px)}" y="20" width="${r(pw)}" height="32" rx="16" fill="${T.pill}" stroke="${T.rule}" stroke-width="1.4"/>`
    + `<circle cx="${r(px + 18)}" cy="36" r="4" fill="${T.live}"/>${text('medium', pill, px + 30, 41, 14, T.ink)}</g>`);
  b.push(hline(72, 0, W, T.rule));

  // ---- Titre + portrait
  const lines = [['Passionné d’UI/UX design,', T.sub], ['j’apprends pour en faire', T.ink], ['de vraies compétences.', T.ink]];
  lines.forEach(([l, c], i) => b.push(`<g class="in" ${d(0.15 + i * 0.07)}>${text('semibold', l, M - 3, 160 + i * 66, 64, c, { tr: -2.4 })}</g>`));
  ['J’aime comprendre pourquoi une interface fonctionne,', 'puis la dessiner dans Figma et la coder pour de vrai.']
    .forEach((l, i) => b.push(`<g class="in" ${d(0.4 + i * 0.05)}>${text('regular', l, M, 352 + i * 29, 20, T.ink)}</g>`));
  b.push(`<clipPath id="ph"><rect x="${PX}" y="72" width="${W - PX}" height="348"/></clipPath>`
    + `<filter id="bw"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.08" intercept="-0.03"/><feFuncG type="linear" slope="1.08" intercept="-0.03"/><feFuncB type="linear" slope="1.08" intercept="-0.03"/></feComponentTransfer></filter>`
    + `<g class="photo"><image href="${img('portrait.jpg')}" x="${PX}" y="20" width="${W - PX}" height="500" preserveAspectRatio="xMidYMid slice" clip-path="url(#ph)" filter="url(#bw)"/></g>`);
  b.push(vline(PX, 72, 420, T.rule), hline(420, 0, W, T.rule));

  // ---- Bandes à libellé
  const band = (label, y) => text('regular', label, M, y, 16, T.sub);
  const big = (s, y, c) => text('medium', s, COL, y, 30, c, { tr: -0.6 });

  // Studio
  b.push(`<g class="in" ${d(0.5)}>${band('Studio', 470)}`
    + big('En mars 2026, encore étudiant, j’ai osé lancer', 472, T.ink)
    + big('mon studio créatif solo : Vision Studio.', 510, T.ink)
    + text('regular', 'Des sites et des identités visuelles pour de vrais clients. C’est là que j’apprends le plus.', COL, 552, 18, T.sub) + '</g>');
  b.push(hline(592, 0, W, T.rule));

  // Parcours
  b.push(`<g class="in" ${d(0.6)}>${band('Parcours', 642)}`
    + big('J’aime toucher à tout.', 644, T.ink)
    + big('Je cherche encore ce que j’aime vraiment faire.', 682, T.sub) + '</g>');
  const steps = ['Architecture', 'Ingénieur', 'Informatique', 'Marketing', 'Gestion', 'Design', 'Informatique'];
  const TY = 742, span = W - M - COL, stepW = span / (steps.length - 1);
  b.push(`<rect class="grow" x="${COL}" y="${TY - 0.7}" width="${span}" height="1.4" fill="${T.rule}"/>`);
  steps.forEach((s, i) => {
    const x = COL + i * stepW, last = i === steps.length - 1;
    const lw = width('regular', s, 15);
    const tx = last ? x - lw : i === 0 ? x : x - lw / 2;
    b.push(`<g class="in" ${d(0.75 + i * 0.09)}>`
      + (last ? `<circle cx="${r(x)}" cy="${TY}" r="9" fill="none" stroke="${T.ink}" stroke-width="1.2"/>` : '')
      + `<circle cx="${r(x)}" cy="${TY}" r="${last ? 4.5 : 3.5}" fill="${last ? T.ink : T.sub}"/>`
      + text(last ? 'medium' : 'regular', s, tx, TY + 34, 15, last ? T.ink : T.sub)
      + (last ? text('regular', 'aujourd’hui', x - width('regular', 'aujourd’hui', 13), TY + 54, 13, T.sub) : '')
      + '</g>');
  });
  b.push(hline(830, 0, W, T.rule));

  // Architecture
  b.push(`<g class="in" ${d(0.7)}>${band('Architecture', 880)}`
    + big('L’architecture me passionne aussi.', 882, T.ink)
    + big('Je la transmets sur Minecraft', 920, T.sub)
    + big('avec Strawberry Crew.', 958, T.sub) + '</g>');
  b.push(axo(T, 968, 962, 14));
  b.push(vline(COL - 24, 420, H, T.rule), hline(H - 1, 0, W, T.rule));

  return doc({
    h: H, title: 'Nicolas Delli Muti',
    desc: 'Nicolas Delli Muti, étudiant en informatique à Mons. Passionné d’UI/UX design, il apprend pour en faire de vraies compétences. En mars 2026, encore étudiant, il a lancé son studio créatif solo, Vision Studio : des sites et des identités visuelles pour de vrais clients. Il aime toucher à tout et cherche encore ce qu’il aime vraiment faire ; son parcours : architecture, ingénieur, informatique, marketing, gestion, design, et aujourd’hui l’informatique. Passionné d’architecture, il la transmet sur Minecraft avec Strawberry Crew. Un dessin axonométrique au trait montre une tour.',
    style: `
.photo { animation: photo 1.4s .2s cubic-bezier(.2,.7,.2,1) both; }
@keyframes photo { from { opacity: 0; } to { opacity: 1; } }
.grow { transform-box: fill-box; transform-origin: left; animation: grow 1.4s .7s cubic-bezier(.6,0,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: none; } }
.draw { stroke-dasharray: 1; animation: draw 1.6s cubic-bezier(.6,0,.2,1) both; }
@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }`,
    body: b.join('\n'),
  });
}

// Rangée de liens : trois cellules posées côte à côte dans le README.
// La première fait la largeur de la colonne des libellés (23 %), les deux autres 38,5 %,
// pour que les filets verticaux tombent sur ceux des bandes au-dessus et en dessous.
const CELLS = [COL - 24, (W - COL + 24) / 2, (W - COL + 24) / 2];
const LINKS = [
  { id: 'strawberry', label: 'Minecraft', value: 'Strawberry Crew' },
  { id: 'instagram', label: 'Instagram', value: '@nicolasdellimuti' },
  { id: 'studio', label: 'Studio', value: 'vision-studio.be' },
];
function cell(l, i, theme) {
  const T = THEMES[theme];
  const CW = CELLS[i], H = 104;
  const x = i === 0 ? M : 24;
  const vw = width('medium', l.value, 22);
  return doc({
    w: CW, h: H, title: l.value, desc: `${l.label} : ${l.value}`,
    body: [
      vline(1, 0, H, T.rule), i === 2 ? vline(CW - 1, 0, H, T.rule) : '', hline(H - 1, 0, CW, T.rule),
      `<g class="in" style="animation-delay:${r(0.65 + i * 0.06)}s">`,
      text('regular', l.label, x, 40, 15, T.sub),
      text('medium', l.value, x, 74, 22, T.ink),
      arrow(x + vw + 10, 72, 22, T.ink),
      '</g>',
    ].join('\n'),
  });
}

for (const theme of ['light', 'dark']) {
  const files = { [`intro-${theme}.svg`]: intro(theme) };
  LINKS.forEach((l, i) => (files[`lien-${l.id}-${theme}.svg`] = cell(l, i, theme)));
  for (const [n, svg] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, n), svg);
    console.log(`${n.padEnd(28)} ${(svg.length / 1024).toFixed(1)} kB`);
  }
}
