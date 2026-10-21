export const APP_VERSION = '1.24.3';
export const APP_RELEASE_NAME = 'Élénk 3D Színátmenetes Mutatók & Csoportosított Eredmények';
export const APP_RELEASE_DATE = '2026-10-21';
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
    'Élénk 3D Színátmenetes Százaléksávok (MatchCompactList.tsx): Nem egyszínű és nem olvad bele a sötét háttérbe; vibráló többárnyalatos gradiens (smaragd-türkiz-cián és borostyán-rózsa-lila) 3D üvegfénnyel, felső élfény-tükröződéssel és mély süllyesztett ágyazattal',
    'Eredmények Csoportosítása Dátum Szerint (ResultsView.tsx): A befejezett meccsek dátumonként (Ma, Tegnap, korábbi naptári napok) csoportosítva, magyar napnevekkel és meccsszám-jelvényekkel jelennek meg',
    'Eredmények Eltűnésének Megszüntetése: Az új "Összes Befejezett Eredmény" fül révén a lezárt mérkőzések mindig azonnal láthatók és soha többé nem rejtőznek el üres fül mögé',
    'Adatmegőrzési Kapacitás (historyService.ts): 300 mérkőzés (~60–90 nap / 2–3 hónap) tartós helyi tárolása localStorage-ban (FIFO), valamint közvetlen JSON naplóletöltés és import',
    '199 / 199 Zöld Teszt: Új regressziós tesztek a dátum szerinti csoportosításra és a 300 mérkőzéses előzménytárra',
  ],
};
