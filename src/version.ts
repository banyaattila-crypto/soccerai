export const APP_VERSION = '1.26.1';
export const APP_RELEASE_NAME = 'Szezon-alapú Modell: Éles Ellenőrzés Utáni Javítás';
export const APP_RELEASE_DATE = '2026-10-22';
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
    'Szezon-alapú illesztés: a Dixon–Coles modell a teljes aktuális (és szükség esetén az előző) szezon lejátszott meccseiből tanul, a korábbi 3 napos ablak helyett',
    'Egységes skála: a gólszint (μ) és a hazai előny (γ) külön paraméter, megszűnt a +21% / +10%-os gólszám-torzítás',
    'Kerekítetlen valószínűség az EV-hez és a Kelly-hez (korábban egész százalék); gólmátrix 12x12 (korábban 8x8)',
    'Őszinte adatalap: egynapos mintából már nem készül "illesztett" modell; nincs elég minta esetén ligaátlag + klub-prior',
    '90 perces eredmény hosszabbítás/tizenegyes esetén (rendes játékidő), a piacok helyes elszámolásához',
    'Tartósabb modellek: 24 órás cache, hibacache a nem elérhető ligákra, kvóta- és időkeret-védelem',
    'Átmeneti hibák (429, hálózat) nem cache-elődnek hibaként; részleges előzményből készült modell nem tartósul',
    '237 / 237 zöld teszt (25 tesztfájl)',
  ],
};
