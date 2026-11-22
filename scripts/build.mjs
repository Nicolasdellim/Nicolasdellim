// Génère les SVG statiques de /assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.mkdirSync(root, { recursive: true });
const mods = await Promise.all(['hero', 'links', 'stack'].map((m) => import(`./${m}.mjs`).catch(() => null)));
const [heroM, linksM, stackM] = mods;

for (const theme of ['dark', 'light']) {
  const files = {};
  if (heroM) files[`hero-${theme}.svg`] = heroM.hero(theme);
  if (stackM) files[`stack-${theme}.svg`] = stackM.stack(theme);
  if (linksM) for (const l of linksM.LINKS) files[`link-${l.id}-${theme}.svg`] = linksM.linkButton(l, theme);
  for (const [name, svg] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), svg);
    console.log(`${name.padEnd(24)} ${(svg.length / 1024).toFixed(1)} kB`);
  }
}
