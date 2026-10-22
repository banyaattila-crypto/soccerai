export const APP_VERSION = '1.29.0';
export const APP_RELEASE_NAME = 'Nyolc Új Liga a Backtest Alapján';
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
    'Nyolc új liga: Eliteserien (NOR), Allsvenskan (SWE), Superliga (DNK), Veikkausliiga (FIN), League of Ireland (IRL), J1 League (JPN), Liga MX (MEX), Liga I (ROU)',
    'A választás a backtesten alapul: ezeken a ligákon a modell a naiv gyakoriságnál 0,04–0,09 log-loss-szal jobb (a gyenge lengyel, osztrák, MLS és argentin ligákat nem bővítettük)',
    'Nincs extra API-kvóta: az API-Sports napi fixture-lekérése az összes ligát visszaadja',
    'Új ligák adatalapja: ligaátlag + prior ("Ligaátlag + prior" felirat), szezon-előzmény még nincs',
    '277 / 277 zöld teszt (28 tesztfájl)',
  ],
};
