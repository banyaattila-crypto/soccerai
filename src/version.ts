export const APP_VERSION = '1.30.0';
export const APP_RELEASE_NAME = 'Csapatonkénti Becslés az Új Ligákon';
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
    'Az új és a korábbi API-Sports ligák (12 liga) csapatonként eltérő becslést kapnak: előre számolt Dixon–Coles erősségek a football-data.co.uk előzményeiből, a ligaátlag helyett',
    'Korábban minden meccs ugyanazt a becslést kapta (pl. Liga MX: 45/27/28), most a csapatok erőssége számít',
    'Pontosabb csapatnév-egyeztetés: ł, ø, æ, ß átírás és a leghosszabb találat választása (pl. Tokyo Verdy ≠ FC Tokyo)',
    'A pillanatkép 120 nap után elavultnak számít és nem használjuk; újragenerálás: node scripts/backtest-download.mjs --extra, majd npx tsx scripts/build-league-models.ts',
    'A fejléc hőtérkép-skála jelvényei (65%+, 55–64%, 45–54%, <45%) eltávolítva',
    '284 / 284 zöld teszt (29 tesztfájl)',
  ],
};
