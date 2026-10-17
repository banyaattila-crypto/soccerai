export const APP_VERSION = '1.1.1';
export const APP_RELEASE_NAME = 'Eredménykiértékelési Javítás & Sokszínű Piacválasztás';
export const APP_RELEASE_DATE = '2026-10-17';
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
    'Valós végeredmény-kiértékelő algoritmus (evaluatePickWon) a tényleges gólok alapján',
    'Millwall - Lincoln City 2:2 és egyéb lezárult meccsek hibás "NEM JÖTT BE" jelzésének javítása',
    'Többpiacos, intelligens ajánló motor: BTTS, Over 2.5, BTTS & Over 2.5, 1X2 és Under 2.5',
    'Dinamikus sikerességi ráta kalkuláció a lezárult mérkőzések valós eredményéből',
    'Kompakt 4 füles Dashboard felépítés és Premier League alapértelmezett ligaszűrő',
  ],
};
