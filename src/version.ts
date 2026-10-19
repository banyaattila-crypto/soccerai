export const APP_VERSION = '1.13.0';
export const APP_RELEASE_NAME = 'ScoreLab H2H, Csapat-összehasonlítás & Bivariáns Dixon-Coles Poisson Gólmátrix';
export const APP_RELEASE_DATE = '2026-10-19';
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
    'ScoreLab H2H & Csapat-összehasonlító Kártya: Forma- és momentum-index (utolsó 5 meccs pontozása), dinamikus összehasonlító sávok (xG, támadóerő α, védelmi stabilitás β), lőtt/kapott gólátlagok',
    'Részletes Egymás Elleni Történet (Head-to-Head): Győzelmek, döntetlenek, átlagos H2H gólszám, BTTS találati arány és korábbi mérkőzések listája',
    'Bivariáns Dixon-Coles Poisson Gólmátrix (Heatmap): 5x5-ös pontos végeredmény valószínűségi hőtérkép cellánkénti valószínűséggel és fair oddsszal',
    'Top 6 Legvalószínűbb Pontos Végeredmény: Érmes rangsor fair oddsokkal (1/p) és 1X2 zóna színkódolással',
    'Gólszám Intervallumok & 1X2 Mátrix Zónák: 0-1, 2-3 és 4+ gól megoszlás a Dixon-Coles MLE korrigált mátrixból',
    '3-utas Navigációs Fülválasztó a Meccs Részletekben: [Áttekintés & Oddsok], [H2H & Csapatok], [Poisson Mátrix]',
    '45 darabos Automatikus Vitest Tesztkészlet és Szigorú Típusbiztonság (Strict TS, 0 Oxlint hiba/figyelmeztetés)',
  ],
};
