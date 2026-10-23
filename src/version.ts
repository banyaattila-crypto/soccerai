export const APP_VERSION = '1.34.1';
export const APP_RELEASE_NAME = 'Rendezett Komponensek';
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
    'Szerkezeti tisztítás, viselkedés-változás nélkül: a Napi Top Tipp kártya, a Scanner találati kártyája és ligaradarja, valamint a Beállítások PIN-szakasza külön komponens',
    'ScannerView 687 -> 456, TopPicks 647 -> 359, SettingsModal 633 -> 284 sor; a legnagyobb komponens már 767 sor (korábban 1223)',
    '312 / 312 zöld teszt (35 tesztfájl)',
  ],
};
