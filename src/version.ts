export const APP_VERSION = '1.33.2';
export const APP_RELEASE_NAME = 'Tovább Szétvágott Komponensek';
export const APP_RELEASE_DATE = '2026-10-23';
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
    'Szerkezeti tisztítás, viselkedés-változás nélkül: a Mérkőzés fül fejléce, eszköztára és aktív szűrő-chipjei, valamint az Eredmények KPI-rácsa, fülválasztója és piaci bontása külön komponens',
    'StatsGrid 930 -> 767 sor, ResultsView 917 -> 750 sor (az eredeti 1223 és 1081 helyett)',
    '307 / 307 zöld teszt (34 tesztfájl)',
  ],
};
