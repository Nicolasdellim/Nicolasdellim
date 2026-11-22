// Génère les SVG statiques de /assets : la page d'intro et la rangée de liens.
// DA de vision-studio.be : fond clair, filets fins, titre en deux tons, Switzer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, M, COL, THEMES, text, width, arrow, vline, hline, doc, r } from './lib.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

function intro(theme) {
  const T = THEMES[theme];
  const H = 552;
  const b = [];
  b.push(vline(1, 0, H, T.rule), vline(W - 1, 0, H, T.rule), hline(1, 0, W, T.rule));

  // Bande du haut : nom à gauche, pastille à droite.
  b.push(`<g class="in">${text('medium', 'Nicolas Delli Muti', M, 46, 18, T.ink)}</g>`);
  const pill = 'Étudiant en informatique · Mons';
  const pw = width('medium', pill, 14) + 44;
  const px = W - M - pw;
  b.push(`<g class="in" style="animation-delay:.08s"><rect x="${r(px)}" y="20" width="${r(pw)}" height="32" rx="16" fill="${T.pill}" stroke="${T.rule}" stroke-width="1.4"/>`
    + `<circle cx="${r(px + 18)}" cy="36" r="4" fill="${T.live}"/>${text('medium', pill, px + 30, 41, 14, T.ink)}</g>`);
  b.push(hline(72, 0, W, T.rule));

  // Titre en deux tons, comme sur le site.
  const HS = 64, LH = 66;
  const lines = [['Passionné d’UI/UX design,', T.sub], ['j’apprends pour en faire', T.ink], ['de vraies compétences.', T.ink]];
  lines.forEach(([l, c], i) => b.push(`<g class="in" style="animation-delay:${r(0.15 + i * 0.07)}s">${text('semibold', l, M - 3, 160 + i * LH, HS, c, { tr: -2.4 })}</g>`));
  const P = ['J’aime comprendre pourquoi une interface fonctionne,', 'puis la dessiner dans Figma et la coder pour de vrai.'];
  P.forEach((l, i) => b.push(`<g class="in" style="animation-delay:${r(0.4 + i * 0.05)}s">${text('regular', l, M, 352 + i * 29, 20, T.ink)}</g>`));
  b.push(hline(420, 0, W, T.rule));

  // Architecture.
  b.push(`<g class="in" style="animation-delay:.55s">${text('regular', 'Architecture', M, 470, 16, T.sub)}`
    + `${text('medium', 'L’architecture me passionne aussi.', COL, 472, 30, T.ink, { tr: -0.6 })}`
    + `${text('medium', 'Je la transmets sur Minecraft avec Strawberry Crew.', COL, 512, 30, T.sub, { tr: -0.6 })}</g>`);
  b.push(vline(COL - 24, 420, H, T.rule), hline(H - 1, 0, W, T.rule));

  return doc({
    h: H, title: 'Nicolas Delli Muti',
    desc: 'Nicolas Delli Muti, étudiant en informatique à Mons. Passionné d’UI/UX design, il apprend pour en faire de vraies compétences : comprendre pourquoi une interface fonctionne, la dessiner dans Figma et la coder. Passionné d’architecture, il la transmet sur Minecraft avec Strawberry Crew.',
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
