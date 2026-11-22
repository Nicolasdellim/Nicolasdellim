// Bande « Activité » : les contributions des 12 derniers mois en grille de points.
// Usage : node activity.mjs <login> <dossier>   (GITHUB_TOKEN, sinon `gh auth token`)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { W, M, COL, THEMES, text, vline, hline, doc, r } from './lib.mjs';

const [login = 'Nicolasdellim', outDir = '../dist'] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN || execSync('gh auth token').toString().trim();

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity' },
  body: JSON.stringify({
    query: `query($l: String!) { user(login: $l) { contributionsCollection { contributionCalendar {
      totalContributions weeks { contributionDays { date contributionCount weekday } } } } } }`,
    variables: { l: login },
  }),
});
const json = await res.json();
const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
if (!cal) { console.error(JSON.stringify(json)); process.exit(1); }
const weeks = cal.weeks.map((w) => w.contributionDays);
const max = Math.max(1, ...weeks.flat().map((d) => d.contributionCount));
const level = (n) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.999)));
const OPA = [1, 0.28, 0.5, 0.75, 1];

function render(theme) {
  const T = THEMES[theme];
  const STEP = (W - M - COL) / weeks.length;
  const D = STEP - 4;
  const top = 104;
  const H = top + 7 * STEP + 44;
  const b = [vline(1, 0, H, T.rule), vline(W - 1, 0, H, T.rule), vline(COL - 24, 0, H, T.rule), hline(H - 1, 0, W, T.rule)];
  const total = cal.totalContributions;
  b.push(`<g class="in">${text('regular', 'Activité', M, 50, 16, T.sub)}`
    + text('medium', `${total.toLocaleString('fr-BE')} contribution${total > 1 ? 's' : ''} sur les 12 derniers mois`, COL, 52, 22, T.ink) + '</g>');
  const dots = [];
  weeks.forEach((wk, wi) => {
    for (const d of wk) {
      const lv = level(d.contributionCount);
      const x = COL + wi * STEP, y = top + d.weekday * STEP;
      const fill = lv ? T.ink : T.dot0;
      dots.push(`<rect class="dot" style="animation-delay:${r(0.3 + wi * 0.012)}s" x="${r(x)}" y="${r(y)}" width="${r(D)}" height="${r(D)}" rx="${r(D / 2)}" fill="${fill}"${lv ? ` fill-opacity="${OPA[lv]}"` : ''}/>`);
    }
  });
  b.push(dots.join(''));
  return doc({
    h: Math.ceil(H), title: 'Activité GitHub',
    desc: `${total} contributions GitHub sur les 12 derniers mois, en grille de points.`,
    style: `
.dot { animation: dot .6s ease-out both; }
@keyframes dot { from { opacity: 0; } to { opacity: 1; } }`,
    body: b.join('\n'),
  });
}

fs.mkdirSync(outDir, { recursive: true });
for (const t of ['light', 'dark']) fs.writeFileSync(path.join(outDir, `activite-${t}.svg`), render(t));
console.log(`activité : ${cal.totalContributions} contributions`);
