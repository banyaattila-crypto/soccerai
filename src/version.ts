export const APP_VERSION = '1.24.8';
export const APP_RELEASE_NAME = 'Intelligens Scanner Megjelenítés és Valós Odds Tájékoztató';
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
    'Klasszikus Stadionzöld és Sportfogadási Arany Százaléksávok (MatchCompactList.tsx): A türkiz, rózsaszín és lila árnyalatok teljes eltávolítása',
    '1. Mutató (Fő piac): Mély, elegáns stadion fűzöld és smaragd színátmenet (emerald-600 -> green-500) finom zöld aurával',
    '2. Mutató (Másodlagos piac): Meleg prémium sportfogadási arany és borostyán színátmenet (amber-600 -> yellow-500) meleg arany aurával',
    '3D Taktilis Mélység: Süllyesztett ágyazat, felső élfény és kristálytiszta fehér kontrasztos feliratok',
    '199 / 199 Zöld Teszt: Minden tesztcsomag és szigorú típusellenőrzés zöld',
  ],
};
