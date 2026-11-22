// Activité GitHub des 12 derniers mois en skyline isométrique.
// Usage : node activity.mjs <login> <dossier de sortie>   (GITHUB_TOKEN requis)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { THEMES, ACC, iso, box, quad, text, measure, svgDoc, mix, r } from './lib/iso.mjs';

const [login = 'Nicolasdellim', outDir = '../dist'] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN || execSync('gh auth token').toString().trim();

const Q = `query($login: String!) { user(login: $login) {
  followers { totalCount }
  contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount weekday } } } }
  repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
    totalCount
    nodes { stargazerCount languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
  }
} }`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity' },
  body: JSON.stringify({ query: Q, variables: { login } }),
});
const json = await res.json();
if (!json.data?.user) { console.error(JSON.stringify(json)); process.exit(1); }
const U = json.data.user;
const cal = U.contributionsCollection.contributionCalendar;
const weeks = cal.weeks.map((w) => w.contributionDays);
const days = weeks.flat();

// ---------- Statistiques
const today = days[days.length - 1].date;
let cur = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) cur++;
  else if (days[i].date === today) continue; // la journée n'est pas finie
  else break;
}
let best = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; best = Math.max(best, run); }
const max = Math.max(1, ...days.map((d) => d.contributionCount));
const byDay = Array(7).fill(0);
for (const d of days) byDay[d.weekday] += d.contributionCount;
const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const busiest = cal.totalContributions ? JOURS[byDay.indexOf(Math.max(...byDay))] : '—';
const stars = U.repositories.nodes.reduce((a, n) => a + n.stargazerCount, 0);

const langs = {};
for (const n of U.repositories.nodes) for (const e of n.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
const totalB = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
let top = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([n, b]) => [n, b / totalB]);
const other = top.slice(5).reduce((a, [, p]) => a + p, 0);
top = top.slice(0, 5);
if (other > 0.001) top.push(['Autres', other]);
const LCOL = [ACC.violet[1], ACC.cyan[1], ACC.emerald[1], ACC.amber[1], ACC.rose[1], '#6e7681'];

const fmt = (n) => n.toLocaleString('fr-BE').replace(/ | /g, ' ');
const MOIS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

function render(theme) {
  const T = THEMES[theme];
  const dark = theme === 'dark';
  const W = 1200, H = 740, X = 64;
  const out = [];

  out.push(text('mono', 'ACTIVITÉ', X, 92, 13, { tracking: 2, fill: T.muted }));
  const big = fmt(cal.totalContributions);
  out.push(text('sans', big, X - 3, 168, 72, { tracking: -3, fill: T.text }));
  const bw = measure('sans', big, 72, -3);
  out.push(text('regular', 'contributions', X + bw + 14, 140, 19, { fill: T.text }));
  out.push(text('regular', 'sur les 12 derniers mois', X + bw + 14, 164, 19, { fill: T.muted }));

  const stats = [['SÉRIE EN COURS', `${cur} j`], ['PLUS LONGUE SÉRIE', `${best} j`], ['MEILLEUR JOUR', String(max === 1 && !cal.totalContributions ? 0 : max)], ['JOUR LE PLUS ACTIF', busiest]];
  let sx = X;
  for (const [lab, val] of stats) {
    const w = Math.max(measure('mono', lab, 10.5, 1.2), measure('sans', val, 19)) + 28;
    out.push(`<rect x="${sx}" y="196" width="1.5" height="46" fill="${T.line}"/>`);
    out.push(text('mono', lab, sx + 12, 211, 10.5, { tracking: 1.2, fill: T.muted }));
    out.push(text('medium', val, sx + 12, 237, 19, { fill: T.text }));
    sx += w;
  }
  out.push(text('mono', `${U.repositories.totalCount} REPOS  ·  ${stars} ÉTOILE${stars > 1 ? "S" : ""}  ·  ${U.followers.totalCount} FOLLOWER${U.followers.totalCount > 1 ? "S" : ""}`, X, 274, 11.5, { tracking: 1.6, fill: T.muted }));

  // ---------- Skyline
  const s = 16, STEP = 1, CELL = 0.8, PAD = 0.6, HMAX = 6.5;
  const NW = weeks.length;
  const XT = 7 * STEP + PAD * 2, YT = NW * STEP + PAD * 2;
  const I = iso(s, 80 + YT * 0.866 * s, 232);
  const g = [];
  g.push(quad(I, { x: 0.3, y: 0.3, z: -0.02, w: XT + 0.2, d: YT + 0.1 }, `fill="${T.shadow}" opacity="0.6"`));
  g.push(box(I, { x: 0, y: 0, w: XT, d: YT, h: 0.6 }, T.base, { stroke: T.edge, sw: 0.8 }));

  const cells = [];
  weeks.forEach((wk, wi) => {
    for (const d of wk) {
      const x = PAD + d.weekday * STEP + (STEP - CELL) / 2;
      const y = YT - PAD - (wi + 1) * STEP + (STEP - CELL) / 2;
      cells.push({ x, y, d, wi });
    }
  });
  cells.sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const c of cells) {
    const n = c.d.contributionCount;
    if (!n) { g.push(quad(I, { x: c.x, y: c.y, z: 0.6, w: CELL, d: CELL }, `fill="${T.empty.top}"`)); continue; }
    const t = n / max;
    const h = 0.35 + Math.sqrt(t) * HMAX;
    const ramp = t > 0.66 ? ACC.violet : ACC.cyan;
    const f = t > 0.66 ? { top: ramp[0], left: ramp[1], right: ramp[2] } : { top: mix(ramp[0], ramp[1], 0.3 - t * 0.3), left: ramp[1], right: ramp[2] };
    g.push(`<g class="bar" style="animation-delay:${r(0.25 + c.wi * 0.018)}s">${box(I, { x: c.x, y: c.y, z: 0.6, w: CELL, d: CELL, h }, f)}</g>`);
  }
  // Mois sur la tranche avant (face +x).
  let lastM = -1;
  weeks.forEach((wk, wi) => {
    const m = Number(wk[0].date.slice(5, 7)) - 1;
    if (m === lastM) return;
    lastM = m;
    if (wi === 0) return;
    const y = YT - PAD - wi * STEP;
    g.push(text('mono', MOIS[m], 0, 0, 22, { fill: T.muted, attrs: `transform="${I.side(XT, y, 0.47)} scale(0.0175)"` }));
  });
  out.push(`<g>${g.join('\n')}</g>`);

  // ---------- Langages
  const LX = 820, LY = 580, LW = 316;
  out.push(text('mono', 'LANGAGES', LX, LY, 11, { tracking: 1.8, fill: T.muted }));
  let bx = LX;
  top.forEach(([, p], i) => {
    const w = Math.max(2, p * LW - 3);
    out.push(`<rect x="${r(bx)}" y="${LY + 14}" width="${r(w)}" height="8" rx="2" fill="${LCOL[i]}"/>`);
    bx += p * LW;
  });
  top.forEach(([name, p], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = LX + col * 170, y = LY + 50 + row * 24;
    out.push(`<rect x="${x}" y="${y - 9}" width="9" height="9" rx="2" fill="${LCOL[i]}"/>`);
    out.push(text('regular', name, x + 16, y, 14, { fill: T.text }));
    out.push(text('mono', `${(p * 100).toFixed(1).replace('.', ',')} %`, x + 146, y, 11.5, { anchor: 'end', fill: T.muted }));
  });
  const [yy, mm, dd] = today.split('-');
  out.push(text('mono', `MIS À JOUR LE ${dd}/${mm}/${yy}`, LX + LW, LY + 50 + Math.ceil(top.length / 2) * 24 + 10, 10, { anchor: 'end', tracking: 1.4, fill: T.faint }));

  return svgDoc({
    width: W, height: H,
    title: 'Activité GitHub',
    desc: `${cal.totalContributions} contributions sur les 12 derniers mois, en skyline isométrique. Série en cours : ${cur} jours, plus longue série : ${best} jours. Langages : ${top.map(([n, p]) => `${n} ${(p * 100).toFixed(1)} %`).join(', ')}.`,
    style: `
.bar { transform-box: fill-box; transform-origin: 50% 100%; animation: grow .9s cubic-bezier(.2,.7,.2,1) both; }
@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }`,
    body: out.join('\n'),
  });
}

fs.mkdirSync(outDir, { recursive: true });
for (const t of ['dark', 'light']) {
  const svg = render(t);
  fs.writeFileSync(path.join(outDir, `activity-${t}.svg`), svg);
  console.log(`activity-${t}.svg ${(svg.length / 1024).toFixed(1)} kB`);
}
console.log(`total ${cal.totalContributions}, série ${cur}, max ${max}, langages ${top.map((x) => x[0]).join(', ')}`);
