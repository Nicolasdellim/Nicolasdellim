// Bannière : nom + scène isométrique — les parenthèses ( ) de Vision Studio
// posées en volume, une maquette de site qui flotte entre les deux.
import { THEMES, ACC, faces, iso, box, quad, line, text, textD, measure, svgDoc, mix, font, r } from './lib/iso.mjs';

const W = 1200;
const H = 500;

export function hero(theme) {
  const T = THEMES[theme];
  const out = [];
  const X = 64;

  out.push(`<g class="copy">`);
  out.push(`<circle class="pulse" cx="${X + 5}" cy="118" r="5" fill="${ACC.emerald[1]}"/><circle cx="${X + 5}" cy="118" r="5" fill="${ACC.emerald[1]}"/>`);
  out.push(text('mono', 'DESIGNER WEB & GRAPHIQUE  ·  VISION STUDIO  ·  MONS, BE', X + 20, 123, 13.5, { tracking: 1.2, fill: T.muted }));
  out.push(text('sans', 'Nicolas', X - 4, 214, 86, { tracking: -3, fill: T.text }));
  out.push(text('sans', 'Delli Muti', X - 4, 296, 86, { tracking: -3, fill: T.text }));
  out.push(text('regular', 'Je dessine des sites et des identités visuelles,', X, 346, 21, { fill: T.muted }));
  out.push(text('regular', 'de la première maquette Figma jusqu’au code en ligne.', X, 375, 21, { fill: T.muted }));

  const chips = [['Webdesign', ACC.violet[1]], ['Identité visuelle', ACC.rose[1]], ['Front-end', ACC.cyan[1]]];
  out.push(text('mono', 'FOCUS', X, 434, 12, { tracking: 1.6, fill: T.muted }));
  let cx = X + 60;
  for (const [label, c] of chips) {
    const w = measure('mono', label, 13) + 36;
    out.push(`<rect x="${r(cx)}" y="415" width="${r(w)}" height="28" rx="14" fill="${T.chip}" stroke="${T.line}"/>`);
    out.push(`<circle cx="${r(cx + 15)}" cy="429" r="3.5" fill="${c}"/>`);
    out.push(text('mono', label, cx + 25, 433.5, 13, { fill: T.text }));
    cx += w + 8;
  }
  out.push(`</g>`);

  const sc = scene(theme, iso(44, 872, 196));
  out.push(`<g class="scene">${sc.body}</g>`);

  return svgDoc({
    width: W, height: H,
    title: 'Nicolas Delli Muti — designer web &amp; graphique',
    desc: 'Nicolas Delli Muti, designer web et graphique en Belgique, fondateur de Vision Studio. Une illustration isométrique animée montre deux grandes parenthèses en volume avec une maquette de site qui flotte entre elles, un tracé à la plume et un curseur.',
    style: `${sc.style}
.pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(3); opacity: 0; } }
.copy { animation: rise .9s cubic-bezier(.2,.7,.2,1) both; }
.scene { animation: rise 1.1s .15s cubic-bezier(.2,.7,.2,1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`,
    defs: sc.defs,
    body: out.join('\n'),
  });
}

function scene(theme, I) {
  const T = THEMES[theme];
  const dark = theme === 'dark';
  const g = [];
  const BH = 0.3;

  // Dalle avec grille fine.
  const SX = 7.2, SY = 5.4;
  g.push(box(I, { x: 0, y: 0, w: SX, d: SY, h: BH }, T.base, { stroke: T.edge }));
  const grid = [];
  for (let i = 1; i < SX; i++) { const a = I.p(i, 0, BH), b = I.p(i, SY, BH); grid.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`); }
  for (let j = 1; j < SY; j++) { const a = I.p(0, j, BH), b = I.p(SX, j, BH); grid.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`); }
  g.push(`<path d="${grid.join('')}" stroke="${T.line}" stroke-width="0.7" opacity="${dark ? 0.5 : 0.75}"/>`);

  // Nuancier en escalier au fond à droite.
  const sw = ['violet', 'cyan', 'emerald', 'amber'];
  sw.forEach((k, i) => {
    g.push(`<g class="bob b${i % 3}">${box(I, { x: 4.9 + i * 0.5, y: 0.35, w: 0.42, d: 1.2, h: 0.35 + i * 0.32, z: BH }, faces(ACC[k]))}</g>`);
  });

  // Parenthèses : glyphe Switzer extrudé en tranches.
  const glyph = (ch) => {
    const p = font('sans').charToGlyph(ch).getPath(0, 0, 100);
    const b = p.getBoundingBox();
    return { d: textD('sans', ch, 0, 0, 100), b };
  };
  const PH = 3.7;                // hauteur en unités monde
  const YF = 3.25, DEPTH = 0.55, N = 12;
  const paren = (ch, x0, id) => {
    const { b } = glyph(ch);
    const k = PH / (b.y2 - b.y1);
    const parts = [];
    for (let i = 0; i <= N; i++) {
      const y = YF - DEPTH + (i * DEPTH) / N;
      const front = i === N;
      const c = front ? T.mono.front : mix(T.mono.back, T.mono.side, i / N);
      parts.push(`<use href="#${id}" fill="${c}" transform="${I.front(x0, y, BH + PH, k)} translate(${r(-b.x1)} ${r(-b.y1)})"/>`);
    }
    return { svg: parts.join(''), w: (b.x2 - b.x1) * k };
  };
  // Ombres au sol des parenthèses.
  g.push(quad(I, { x: 0.35, y: YF - DEPTH, z: BH, w: 1.2, d: DEPTH + 0.25 }, `fill="${T.shadow}"`));
  g.push(quad(I, { x: 5.55, y: YF - DEPTH, z: BH, w: 1.2, d: DEPTH + 0.25 }, `fill="${T.shadow}"`));
  const L = paren('(', 0.35, 'po');
  g.push(L.svg);

  // Maquette flottante entre les parenthèses.
  const WX = 1.75, WW = 3.7, WZ = BH + 0.75, WH = 2.5, WY = 2.9, WD = 0.12;
  g.push(quad(I, { x: WX + 0.2, y: WY - 0.3, z: BH, w: WW - 0.4, d: 0.75 }, `fill="${T.shadow}" class="shade"`));
  const win = [];
  win.push(box(I, { x: WX, y: WY, z: WZ, w: WW, d: WD, h: WH }, { top: T.key.top, left: T.key.left, right: T.key.right }, { stroke: T.edge, sw: 0.8 }));
  const F = I.front(WX, WY + WD, WZ + WH);
  const u = (n) => r(n);
  const face = [];
  face.push(`<rect x="0.1" y="0.08" width="${WW - 0.2}" height="0.22" rx="0.05" fill="${dark ? '#262d36' : '#e9edf1'}"/>`);
  ['rose', 'amber', 'emerald'].forEach((k, i) => face.push(`<circle cx="${u(0.24 + i * 0.16)}" cy="0.19" r="0.045" fill="${ACC[k][1]}"/>`));
  face.push(`<rect x="1.25" y="0.15" width="1.3" height="0.08" rx="0.04" fill="${T.faint}" opacity="0.7"/>`);
  face.push(`<rect x="0.1" y="0.4" width="${WW - 0.2}" height="1.2" rx="0.06" fill="url(#heroimg)"/>`);
  face.push(`<rect x="0.3" y="0.62" width="1.6" height="0.17" rx="0.03" fill="#ffffff"/>`);
  face.push(`<rect x="0.3" y="0.87" width="1.1" height="0.17" rx="0.03" fill="#ffffff" opacity="0.9"/>`);
  face.push(`<rect x="0.3" y="1.14" width="1.4" height="0.06" rx="0.03" fill="#ffffff" opacity="0.6"/>`);
  face.push(`<rect x="0.3" y="1.3" width="0.62" height="0.18" rx="0.09" fill="${ACC.amber[0]}"/>`);
  face.push(`<circle cx="2.85" cy="1.0" r="0.38" fill="#ffffff" opacity="0.18"/><circle cx="2.85" cy="1.0" r="0.22" fill="#ffffff" opacity="0.35"/>`);
  ['cyan', 'emerald', 'violet'].forEach((k, i) => {
    const x = 0.1 + i * 1.18;
    face.push(`<rect x="${u(x)}" y="1.72" width="1.06" height="0.62" rx="0.05" fill="${dark ? '#232a33' : '#eef1f4'}"/>`);
    face.push(`<rect x="${u(x + 0.1)}" y="1.82" width="0.26" height="0.26" rx="0.05" fill="${ACC[k][1]}"/>`);
    face.push(`<rect x="${u(x + 0.1)}" y="2.16" width="0.75" height="0.06" rx="0.03" fill="${T.faint}"/>`);
  });
  // Cadre de sélection façon Figma.
  const S = ACC.violet[1];
  face.push(`<rect class="sel" x="-0.06" y="-0.06" width="${WW + 0.12}" height="${WH + 0.12}" stroke="${S}" stroke-width="0.025" fill="none"/>`);
  for (const [hx, hy] of [[-0.06, -0.06], [WW + 0.06, -0.06], [-0.06, WH + 0.06], [WW + 0.06, WH + 0.06]]) {
    face.push(`<rect class="sel" x="${u(hx - 0.05)}" y="${u(hy - 0.05)}" width="0.1" height="0.1" fill="${T.key.top}" stroke="${S}" stroke-width="0.022"/>`);
  }
  win.push(`<g transform="${F}">${face.join('')}</g>`);
  // Étiquette de dimensions sous le cadre.
  const tag = '1440 × 960';
  const tw = measure('mono', tag, 11) + 14;
  const P0 = I.front(WX + WW / 2, WY + WD, WZ - 0.18, 0.01);
  win.push(`<g class="sel" transform="${P0}"><rect x="${r(-tw / 2)}" y="-1" width="${r(tw)}" height="18" rx="4" fill="${S}"/>${text('mono', tag, 0, 12, 11, { anchor: 'middle', fill: '#ffffff' })}</g>`);
  g.push(`<g class="float">${win.join('')}</g>`);

  const Rp = paren(')', 5.55, 'pc');
  g.push(Rp.svg);

  // Tracé à la plume sur la dalle, avec poignées.
  const M = I.top(0, 0, BH);
  const curve = 'M0.7 4.6 C 2 3.7, 3.1 5.05, 4.2 4.35 S 5.9 3.95, 6.6 4.5';
  const pen = [];
  pen.push(`<path d="${curve}" stroke="${T.text}" stroke-width="0.035" fill="none" stroke-linecap="round" opacity="0.9"/>`);
  pen.push(`<path d="M2 3.7 L0.7 4.6 M3.1 5.05 L4.2 4.35 L5.3 3.65 M5.9 3.95 L6.6 4.5" stroke="${S}" stroke-width="0.02" opacity="0.9"/>`);
  for (const [hx, hy] of [[2, 3.7], [3.1, 5.05], [5.3, 3.65], [5.9, 3.95]]) pen.push(`<circle cx="${hx}" cy="${hy}" r="0.06" fill="${S}"/>`);
  for (const [ax, ay] of [[0.7, 4.6], [4.2, 4.35], [6.6, 4.5]]) pen.push(`<rect x="${ax - 0.08}" y="${ay - 0.08}" width="0.16" height="0.16" fill="${T.key.top}" stroke="${S}" stroke-width="0.03"/>`);
  pen.push(`<circle r="0.1" fill="${ACC.amber[1]}"><animateMotion dur="5s" repeatCount="indefinite" keyPoints="0;1;1;0;0" keyTimes="0;0.42;0.5;0.92;1" calcMode="linear" path="${curve}"/></circle>`);
  g.push(`<g transform="${M}">${pen.join('')}</g>`);

  // Petits cubes flottants.
  g.push(`<g class="bob b1">${box(I, { x: -0.5, y: 1.4, z: 3.6, w: 0.28, d: 0.28, h: 0.28 }, faces(ACC.rose))}</g>`);
  g.push(`<g class="bob b2">${box(I, { x: 7.6, y: 3.6, z: 1.7, w: 0.24, d: 0.24, h: 0.24 }, faces(ACC.violet))}</g>`);
  g.push(`<g class="bob b0">${box(I, { x: 1.6, y: -0.4, z: 3.9, w: 0.22, d: 0.22, h: 0.22 }, faces(ACC.cyan))}</g>`);

  // Curseur multijoueur « Nicolas ».
  const c0 = I.p(WX + 0.6, WY + WD, WZ + 1.4), c1 = I.p(WX + 2.9, WY + WD, WZ + 2.1), c2 = I.p(WX + 2.4, WY + WD, WZ + 0.5);
  const cpath = `M${r(c0[0])} ${r(c0[1])} Q ${r(c1[0] - 40)} ${r(c1[1] - 30)}, ${r(c1[0])} ${r(c1[1])} T ${r(c2[0])} ${r(c2[1])} Z`;
  const nl = 'Nicolas';
  const nw = measure('medium', nl, 12) + 16;
  g.push(`<g><g>
<path d="M0 0 L0 15 L4 11.2 L6.6 17 L9 16 L6.5 10.3 L11.5 10.3 Z" fill="${S}" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
<rect x="11" y="16" width="${r(nw)}" height="20" rx="5" fill="${S}"/>${text('medium', nl, 19, 30.5, 12, { fill: '#ffffff' })}
<animateMotion dur="9s" repeatCount="indefinite" calcMode="spline" keyPoints="0;0.33;0.66;1" keyTimes="0;0.33;0.66;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1" path="${cpath}"/></g></g>`);

  const style = `
.float { animation: float 6s cubic-bezier(.45,0,.55,1) infinite; }
.shade { animation: shade 6s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes shade { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.sel { animation: sel 9s ease-in-out infinite; }
@keyframes sel { 0%,8% { opacity: 0; } 14%,62% { opacity: 1; } 70%,100% { opacity: 0; } }
.bob { animation: bob 4.5s cubic-bezier(.45,0,.55,1) infinite; }
.b1 { animation-duration: 5.5s; animation-delay: -2s; } .b2 { animation-duration: 7s; animation-delay: -1s; }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`;

  const defs = `
<path id="po" d="${glyph('(').d}"/><path id="pc" d="${glyph(')').d}"/>
<linearGradient id="heroimg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${ACC.violet[1]}"/><stop offset="0.6" stop-color="${ACC.rose[1]}"/><stop offset="1" stop-color="${ACC.amber[1]}"/>
</linearGradient>`;
  return { body: g.join('\n'), style, defs };
}
