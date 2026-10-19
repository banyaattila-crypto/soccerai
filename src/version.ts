export const APP_VERSION = '1.16.2';
export const APP_RELEASE_NAME = 'Valós Élő API Adatok Garanciája & Kvótavédelem';
export const APP_RELEASE_DATE = '2026-10-19';
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
    'Valós Élő API Adatok Garanciája: Megszűnt a csendes mock adatokra való visszatérés; az API módban kizárólag valós mérkőzések jelennek meg',
    '429 Kvótavédelem & 0 Extra Kérés: A Dixon-Coles modellek a már letöltött meccsekből és európai priorokból épülnek, nem merítik le az ingyenes API kvótát',
    'Bajnokok Ligája és Kupa Meccsek Modellezése: Teljes európai kupa támogatás (9 holnapi BL meccs, empirikus támadás-védelem xG és robusztus AI tippek)',
    'Transzparens Hiba- és Figyelmeztető Sáv: Ha az API nem ad vissza adatot vagy kvótapihenés van, a felület világos üzenetet és egykattintásos újratöltést biztosít',
  ],
};
