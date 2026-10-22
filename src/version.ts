export const APP_VERSION = '1.27.0';
export const APP_RELEASE_NAME = 'Piaccal Súlyozás és Valós Backtest';
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
    'Valós walk-forward backtest (5 liga, 3 szezon, Pinnacle záró és nyitó szorzók): a modell jobb a naiv gyakoriságnál, de a záró piacnál rosszabb',
    'A nyers modell-EV hozama negatív (nyitó szorzón −16%, z = −4): valós szorzónál az EV és a Kelly a piaci referenciához (Pinnacle, ennek híján az átlag) mér',
    'Piac nélküli piacra (BTTS, kombinált, félidő) nincs EV és Kelly',
    'Módszertan: a kézi mintaadat helyett a valós backtest eredménye (pontosság-táblázat, fogadási szimuláció, megbízhatósági diagram)',
    'Újrafuttatható backtest: node scripts/backtest-download.mjs, majd npx tsx scripts/backtest.ts',
    '259 / 259 zöld teszt (27 tesztfájl)',
  ],
};
