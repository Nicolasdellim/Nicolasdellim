// Boutons de liens (une image par bouton, chacune cliquable dans le README).
import { siInstagram } from 'simple-icons';
import { THEMES, ACC, text, svgDoc, mix } from './lib/iso.mjs';

const GLOBE = '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z" stroke="currentColor" stroke-width="1.8" fill="none"/>';
const MAIL = '<rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>';
const INSTA = `<path d="${siInstagram.path}" fill="currentColor"/>`;

export const LINKS = [
  { id: 'site', label: 'Vision Studio', icon: GLOBE, primary: true },
  { id: 'instagram', label: 'Instagram', icon: INSTA },
  { id: 'email', label: 'Email', icon: MAIL },
];

export function linkButton(link, theme) {
  const T = THEMES[theme];
  const W = 340, H = 92;
  const p = link.primary;
  const bg = p ? ACC.violet[1] : T.chip;
  const lip = p ? ACC.violet[2] : mix(T.line, T.bg, theme === 'dark' ? 0.2 : 0);
  const fg = p ? '#ffffff' : T.text;
  return svgDoc({
    width: W, height: H,
    title: link.label, desc: `Lien : ${link.label}`,
    style: `.b { transition: transform .2s; }`,
    body: `<rect x="4" y="10" width="${W - 8}" height="${H - 14}" rx="14" fill="${lip}"/>
<rect x="4" y="4" width="${W - 8}" height="${H - 16}" rx="14" fill="${bg}" stroke="${p ? ACC.violet[0] : T.line}" stroke-opacity="${p ? 0.6 : 1}" stroke-width="2"/>
<g transform="translate(34 24) scale(1.25)" color="${fg}">${link.icon}</g>
${text('medium', link.label, 82, 53, 26, { fill: fg })}
<path d="M${W - 52} 52 L${W - 38} 38 M${W - 48} 38 H${W - 38} V48" stroke="${fg}" stroke-opacity="0.75" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  });
}
