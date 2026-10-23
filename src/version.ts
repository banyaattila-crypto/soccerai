export const APP_VERSION = '1.41.0';
export const APP_RELEASE_NAME = 'Kevesebb Zöld';
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
    'A zöld már nem az arculat alapszíne: a márka, a navigáció, az aktív fülek, az elsődleges gombok és a kiemelések kobaltkék színt kaptak',
    'A zöld csak pozitív jelentésre marad (nyert, nyereség, pozitív érték, siker), visszafogott zsálya árnyalatban; a piros a negatív, az okker a figyelmeztetés',
    'Színszerepek tokenekben (src/index.css): brand (kobalt), emerald (zsálya, csak pozitív), teal (hűvös szürkéskék); a 3D gombok, a háttér-derengés és a grafikonok is követik',
    '375 / 375 zöld teszt (41 tesztfájl)',
  ],
};
