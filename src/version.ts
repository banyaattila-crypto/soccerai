export const APP_VERSION = '1.22.0';
export const APP_RELEASE_NAME = '3D Nyomógomb Rendszer & Finom Aranykeret (Tactile 3D Pushbuttons with Gold Rim)';
export const APP_RELEASE_DATE = '2026-10-21';
export const APP_GITHUB_REPO = 'https://github.com/banyaattila-crypto/soccerai';
export const APP_GITHUB_RELEASES = 'https://github.com/banyaattila-crypto/soccerai/releases';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  tag: string;
  highlights: string[];
}

export const CURRENT_RELEASE_INFO: VersionInfo = {
  version: APP_VERSION,
  releaseDate: APP_RELEASE_DATE,
  tag: `v${APP_VERSION}`,
  highlights: [
    '3D Nyomógomb Rendszer & Finom Aranykeret: Minden interaktív gomb megkülönböztetett, precíz vékony aranykeretet (1px subtle gold rim) és felső fényélt (top bevel) kapott',
    'Fizikai 3D Megnyomás & Kiemelkedés (Tactile Depress): Kattintáskor és érintéskor 2px-es mechanikus lenyomási animáció és belső árnyékadás',
    'Arany Ragyogás Hover Állapotban: Interakciókor elegáns meleg arany halo (glow) jelzi a gombok kattinthatóságát a sötét háttéren',
    'Minden Felületi Elemre Optimalizálva: Navigációs fülek, CTA akciógombok, ligaválasztó pills, szűrők és a mérkőzés rács szorzócella nyomógombjai (.btn-cell-3d)',
    'Szöveges Linkek Mentesítése: Az inline információs és verziólinkek (.btn-link) megőrizték elegáns szöveges jellegüket',
  ],
};
