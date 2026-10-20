export const APP_VERSION = '1.17.0';
export const APP_RELEASE_NAME = 'Pre-Match Megmásíthatatlan Predikciónapló & Provenance Rendszer';
export const APP_RELEASE_DATE = '2026-10-20';
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
    'Kvantitatív Érték-Index (Játszható 1.50+ Szorzók): Megszűnt a használhatatlan mini-oddsok (< 1.40) automatikus ajánlása; a modell a fogadói édes-pontot (Sweet Spot: 1.55 – 2.45) részesíti előnyben',
    'Intelligens Piacválasztás Favoritoknál: Ha egy óriásfavorit győzelme csak 1.15-öt fizet, az AI automatikusan a valós értékkel bíró gólpiacokat (Over 2.5, BTTS) javasolja',
    'TopPicks & Scanner Szorzósáv Gyorsválasztó: Dedikált gombok a Top 3 tippnél és a Scannerben (🎯 Érték Szorzók 1.50+, 🌐 Összes szorzó, 🛡️ Alacsony kockázat)',
    'Nagyobb, Folyamatosan Forgó 3D Meccslabda: 46px méret, 97%-os tiszta felületkitöltés, és megállásmentes, lágy, észrevehető ~16 másodperces 3D rotáció',
  ],
};
