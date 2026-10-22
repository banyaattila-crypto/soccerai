export const APP_VERSION = '1.33.1';
export const APP_RELEASE_NAME = 'Szétvágott Komponensek';
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
    'Szerkezeti tisztítás, viselkedés-változás nélkül: a Mérkőzés fül szűrőpanelje (StatsFilterPanel) és az Eredmények kártyája (ResultEntryCard) külön komponens',
    'StatsGrid 1223 -> 930 sor, ResultsView 1081 -> 917 sor; a két mutató-legördülő közös komponensre épül',
    'Az Eredmények kártyán az audit-összeg felirata pontosítva (sérülést jelez, nem hamisítás-biztos)',
    '307 / 307 zöld teszt (34 tesztfájl)',
  ],
};
