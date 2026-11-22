// Stack : un clavier isométrique, une rangée par famille d'outils.
// Les touches « au quotidien » s'enfoncent pendant que le mot se tape à droite.
import * as si from 'simple-icons';
import { THEMES, ACC, faces, iso, box, quad, text, textD, measure, svgDoc, mix, r } from './lib/iso.mjs';

const W = 1200, H = 800;

// [nom, icône simple-icons, quotidien ?]
const ROWS = [
  { cat: 'DESIGN', acc: 'violet', wide: 'delete', keys: [['Figma', 'siFigma', 1], ['Framer', 'siFramer', 1], ['Webflow', 'siWebflow'], ['Canva', 'siCanva'], ['Shopify', 'siShopify'], ['Affinity', 'siAffinitydesigner'], ['Blender', 'siBlender'], ['DaVinci Resolve', 'siDavinciresolve'], ['Notion', 'siNotion'], ['Apple', 'siApple']] },
  { cat: 'FRONT', acc: 'cyan', wide: 'return', keys: [['Next.js', 'siNextdotjs', 1], ['React', 'siReact'], ['TypeScript', 'siTypescript', 1], ['JavaScript', 'siJavascript'], ['Tailwind CSS', 'siTailwindcss', 1], ['HTML5', 'siHtml5'], ['CSS', 'siCss'], ['GSAP', 'siGsap'], ['Three.js', 'siThreedotjs'], ['Vite', 'siVite'], ['Swift', 'siSwift']] },
  { cat: 'BACK', acc: 'emerald', wide: 'shift', keys: [['Supabase', 'siSupabase', 1], ['Drizzle', 'siDrizzle'], ['PostgreSQL', 'siPostgresql'], ['Vercel', 'siVercel', 1], ['Docker', 'siDocker'], ['Node.js', 'siNodedotjs'], ['Bun', 'siBun'], ['Cloudflare', 'siCloudflare'], ['Hostinger', 'siHostinger'], ['Nginx', 'siNginx'], ['Ubuntu', 'siUbuntu']] },
  { cat: 'IA & OUTILS', acc: 'rose', keys: [['Claude', 'siClaude', 1], ['ChatGPT', 'siOpenai', 1], ['Gemini', 'siGooglegemini'], ['Cursor', 'siCursor'], ['Git', 'siGit'], ['GitHub', 'siGithub'], ['Python', 'siPython'], ['Rust', 'siRust'], ['macOS', 'siMacos']], wide: 'vision-studio.be' },
];
const LEGEND = [['Design', 'violet'], ['Front-end', 'cyan'], ['Back & infra', 'emerald'], ['IA & outils', 'rose']];

export function stack(theme) {
  const T = THEMES[theme];
  const dark = theme === 'dark';
  const out = [];
  const X = 64;

  // ---------- Titre
  out.push(text('mono', 'STACK', X, 92, 13, { tracking: 2, fill: T.muted }));
  out.push(text('sans', 'Ma boîte à outils', X - 2, 146, 44, { tracking: -1.4, fill: T.text }));
  out.push(text('regular', 'De la maquette au site en ligne : ce que j’utilise,', X, 184, 19, { fill: T.muted }));
  out.push(text('regular', 'rangé sur un seul clavier.', X, 210, 19, { fill: T.muted }));
  let lx = X;
  for (const [label, k] of LEGEND) {
    out.push(`<rect x="${lx}" y="238" width="10" height="10" rx="2" fill="${ACC[k][1]}"/>`);
    out.push(text('mono', label, lx + 17, 247.5, 12.5, { fill: T.muted }));
    lx += measure('mono', label, 12.5) + 40;
  }
  out.push(`<circle cx="${X + 5}" cy="273" r="4.5" fill="${ACC.amber[1]}"/>`);
  out.push(text('mono', 'Au quotidien', X + 17, 277.5, 12.5, { fill: T.muted }));

  // ---------- Clavier
  const s = 54;
  const KU = 1, GAP = 0.14, KH = 0.4, CAT = 2.3, BASE = 0.5, PAD = 0.35;
  ROWS.forEach((row, i) => (row.i = i));
  const used = (row) => PAD + row.i * 0.28 + CAT + GAP + row.keys.length * (KU + GAP);
  const END = Math.max(...ROWS.map(used)) + 2.3; // chaque rangée finit par une touche large
  const YT = END + PAD;
  const XT = ROWS.length * (KU + GAP) - GAP + PAD * 2;
  const I = iso(s, 96 + YT * 0.866 * s, 150);

  const g = [];
  // Ombre portée + socle.
  g.push(quad(I, { x: 0.25, y: 0.25, z: -0.02, w: XT + 0.2, d: YT + 0.15 }, `fill="${T.shadow}" opacity="0.6"`));
  g.push(box(I, { x: 0, y: 0, w: XT, d: YT, h: BASE }, T.base, { stroke: T.edge }));
  g.push(quad(I, { x: 0.12, y: 0.12, z: BASE, w: XT - 0.24, d: YT - 0.24 }, `fill="${dark ? '#0f1318' : '#eceff3'}" stroke="${T.edge}" stroke-width="0.8"`));

  // Touches, du fond vers l'avant (x + y croissants).
  const keys = [];
  const daily = [];
  ROWS.forEach((row, i) => {
    const x = PAD + i * (KU + GAP);
    let L = PAD + row.i * 0.28;
    keys.push({ kind: 'cat', row, x, y: YT - L - CAT, len: CAT });
    L += CAT + GAP;
    for (const [name, icon, isDaily] of row.keys) {
      const k = { kind: 'key', row, name, icon, isDaily, x, y: YT - L - KU, len: KU };
      if (isDaily) daily.push(k);
      keys.push(k);
      L += KU + GAP;
    }
    keys.push({ kind: 'wide', row, x, y: YT - END, len: END - L });
  });
  keys.sort((a, b) => a.x + a.y + a.len - (b.x + b.y + b.len));

  const U = [0, -1, 0], V = [1, 0, 0];
  const Z = BASE;
  for (const k of keys) {
    const A = ACC[k.row.acc];
    const cls = k.isDaily ? ` class="press p${daily.indexOf(k)}"` : '';
    const parts = [];
    if (k.kind === 'cat') {
      parts.push(box(I, { x: k.x, y: k.y, z: Z, w: KU, d: k.len, h: KH + 0.06 }, faces(A), { stroke: mix(A[0], '#ffffff', 0.25), sw: 0.6 }));
      const P = I.plane(k.x, k.y + k.len, Z + KH + 0.06, U, V);
      const fs = Math.min(0.3, (k.len - 0.5) / measure('mono', k.row.cat, 1));
      parts.push(`<path transform="${P}" d="${textD('mono', k.row.cat, 0.25, 0.5 + fs * 0.35, fs)}" fill="${A[2]}"/>`);
    } else if (k.kind === 'wide') {
      parts.push(box(I, { x: k.x, y: k.y, z: Z, w: KU, d: k.len, h: KH }, T.key, { stroke: T.edge, sw: 0.7 }));
      const P = I.plane(k.x, k.y + k.len, Z + KH, U, V);
      parts.push(`<path transform="${P}" d="${textD('mono', k.row.wide, k.row.i === 3 ? k.len / 2 : k.len - 0.22, k.row.i === 3 ? 0.58 : 0.82, k.row.i === 3 ? 0.24 : 0.2, { anchor: k.row.i === 3 ? 'middle' : 'end' })}" fill="${T.muted}"/>`);
    } else {
      parts.push(box(I, { x: k.x, y: k.y, z: Z, w: KU, d: KU, h: KH }, T.key, { stroke: T.edge, sw: 0.7 }));
      const P = I.plane(k.x, k.y + KU, Z + KH, U, V);
      const ic = si[k.icon];
      const sc = 0.5 / 24;
      if (ic) parts.push(`<path transform="${P} translate(0.25 0.25) scale(${r(sc * 1000) / 1000})" d="${ic.path}" fill="${T.text}" opacity="0.88"/>`);
      if (k.isDaily) parts.push(`<circle transform="${P}" cx="0.86" cy="0.14" r="0.075" fill="${ACC.amber[1]}"/>`);
    }
    g.push(`<g${cls}>${parts.join('')}</g>`);
  }
  out.push(`<g class="kb">${g.join('\n')}</g>`);

  // ---------- Machine à écrire (SMIL : fiable dans une balise <img>)
  const words = daily.map((k) => k.name);
  const SLOT = 2.6, C = SLOT * words.length;
  const FS = 28, cw = measure('mono', 'M', FS);
  const TX = 900, TY = 724;
  out.push(text('mono', 'EN TRAIN DE TAPER', TX - 26, TY - 44, 12, { tracking: 1.8, fill: T.faint }));
  out.push(text('mono', '›', TX - 26, TY, FS, { fill: ACC.emerald[1] }));
  const caret = [];
  const clips = [];
  const typed = [];
  words.forEach((wd, i) => {
    const n = Array.from(wd).length, t0 = i * SLOT;
    const ev = [[0, 0]];
    for (let j = 1; j <= n; j++) ev.push([t0 + 0.12 + j * 0.085, j]);
    const del = t0 + SLOT - 0.2 - n * 0.035;
    for (let m = 1; m <= n; m++) ev.push([del + m * 0.035, n - m]);
    const times = ev.map(([t]) => r((t / C) * 1e4) / 1e4);
    const vals = ev.map(([, j]) => r(j * cw));
    clips.push(`<clipPath id="tw${i}"><rect x="${TX}" y="${TY - FS}" height="${FS * 1.4}" width="0"><animate attributeName="width" dur="${C}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${times.join(';')}" values="${vals.join(';')}"/></rect></clipPath>`);
    typed.push(`<g clip-path="url(#tw${i})">${text('mono', wd, TX, TY, FS, { fill: T.text })}</g>`);
    for (const [t, j] of ev.slice(1)) caret.push([t, j]);
  });
  caret.sort((a, b) => a[0] - b[0]);
  const ct = [0, ...caret.map(([t]) => r((t / C) * 1e4) / 1e4)];
  const cv = [TX + 3, ...caret.map(([, j]) => r(TX + 3 + j * cw))];
  out.push(typed.join(''));
  out.push(`<rect class="caret" x="${TX + 3}" y="${TY - FS * 0.8}" width="${r(FS * 0.42)}" height="${r(FS * 0.95)}" fill="${T.text}"><animate attributeName="x" dur="${C}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${ct.join(';')}" values="${cv.join(';')}"/></rect>`);

  const press = daily.map((_, i) => `.p${i} { animation-delay: ${r(i * SLOT + 0.1)}s; }`).join(' ');
  const style = `
.press { animation: press ${C}s linear infinite; }
${press}
@keyframes press { 0% { transform: translateY(0); } ${r((0.3 / C) * 100)}% { transform: translateY(5px); } ${r((0.9 / C) * 100)}% { transform: translateY(0); } 100% { transform: translateY(0); } }
.caret { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.kb { animation: rise 1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }`;

  const all = ROWS.map((row) => `${row.cat} : ${row.keys.map((k) => k[0]).join(', ')}`).join('. ');
  return svgDoc({
    width: W, height: H,
    title: 'Ma boîte à outils',
    desc: `Clavier isométrique animé des outils de Nicolas. Au quotidien : ${words.join(', ')}. ${all}.`.replace(/&/g, '&amp;'),
    style, defs: clips.join(''), body: out.join('\n'),
  });
}
