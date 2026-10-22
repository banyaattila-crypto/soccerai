export const APP_VERSION = '1.30.1';
export const APP_RELEASE_NAME = 'Friss Becslés a Deploy Után';
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
    'Az API-Sports menetrend-gyorsítótár új kulcsot kap: a v1.30.0 előtt számolt, ligaátlagos becslések (pl. Liga MX: mind 45/27/28) nem maradnak meg a gyorsítótárban',
    'Élőben ellenőrizve: Atlas – Club América 23/25/52, Toluca – Club Tijuana 63/21/16 (korábban mindkettő 45/27/28)',
    '284 / 284 zöld teszt (29 tesztfájl)',
  ],
};
