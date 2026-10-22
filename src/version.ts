export const APP_VERSION = '1.33.0';
export const APP_RELEASE_NAME = 'Mintaadat Nélkül';
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
    'A mintaadat (szimulációs mód, "Offline Demó") teljesen megszűnt: nincs beépített mintameccs, az app csak valós forrásból dolgozik',
    'Egyszeri takarítás: a korábbi szimulációs mód nyomai (archívum, audit-napló, szelvény-piszkozat) törlődnek a böngészőből, a valós rekordok érintetlenek',
    'Proxy: idegen "soccerai*.vercel.app" nevű projekt oldala nem érheti el a szerveroldali API-kulcsot (a saját preview-k same-origin hívása működik)',
    '307 / 307 zöld teszt (34 tesztfájl)',
  ],
};
