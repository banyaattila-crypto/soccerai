export const APP_VERSION = '1.28.1';
export const APP_RELEASE_NAME = 'Következetes Magyarázat a Piaci Esélyhez';
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
    'A szakértői magyarázat a piaci esélyeket használja, ha van valós szorzó, és jelzi a modell eltérő becslését (pl. piac: 81% vs. modell: 46%)',
    'A kiemelt tipp indoklásából kikerültek a megalapozatlan értékállítások ("szilárd pozitív várható érték", "kiemelkedő érték", "legstabilabb matematikai él")',
    '270 / 270 zöld teszt (27 tesztfájl)',
  ],
};
