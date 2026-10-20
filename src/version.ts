export const APP_VERSION = '1.21.1';
export const APP_RELEASE_NAME = 'CI Szigorú Linter & Oxlint Tisztítás (0 warning, 0 error)';
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
    'Valós Böngészős Verifikáció (Headless Chromium CDP): Teljes interaktív ellenőrzés a futó alkalmazáson; 0 unhandled exception, 0 konzolhiba, minden fül, drawer és a 3D meccslabda hibátlanul működik',
    'Időrendhelyes (Chronological Walk-Forward) Mintavételezés: Szigorúan múltból a jövőbe haladó időbeli vágás (T_split), a lookahead bias és adatcsorgás teljes kizárásával',
    'Valószínűségi Kalibráció Mérése (calibrationService): 1X2 Brier-pontszám, Brier Skill Score, Várható Kalibrációs Hiba (ECE) és Megbízhatósági diagram (Reliability Table) decilis bontásban',
    'Szigorú Piaci Előny Hitelesítési Kapu: A rendszer megtiltja az „igazolt piaci előny” állítását N < 250, ECE > 0.08 vagy p >= 0.05 előtt; a jelzett +EV-t kizárólag becsült elméleti értékként tünteti fel',
    '10 Új Dedikált Regressziós Teszt: Összesen 145/145 egységteszt védi a rendszert és a kalibrációs metrikákat (100% pass rate)',
  ],
};
