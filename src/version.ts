export const APP_VERSION = '1.27.1';
export const APP_RELEASE_NAME = 'Backtesten Hangolt Modell-paraméterek';
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
    'A modell hiperparaméterei (időlecsengés ξ = 0,0015, regularizáció K = 5) a valós walk-forward backtesten hangolva, a holdout szezonon ellenőrizve',
    'Holdout 1X2 log-loss: 1,0004 → 0,9982 (piac: 0,9776, naiv: 1,0718); a rés a piachoz kb. 0,02, ezt nem zárja be a paraméterhangolás',
    'Utólagos kalibráció (döntetlen-korrekció, hőmérséklet) nem javít: a modell átlagosan jól kalibrált',
    'Újrafuttatható hangolás: npx tsx scripts/backtest-tune.ts',
    '259 / 259 zöld teszt (27 tesztfájl)',
  ],
};
