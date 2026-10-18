export const APP_VERSION = '1.9.1';
export const APP_RELEASE_NAME = 'Szigorú Típusbiztonság, Rules of Hooks Megfelelőség & CI Titokvédelem';
export const APP_RELEASE_DATE = '2026-10-18';
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
    'React Rules of Hooks Helyreállítása: A MatchDetailModal hookjai feltétel nélkül a legfelső szintre kerültek, kiküszöbölve a feltételes hook-hívás miatti összeomlásveszélyt',
    'Valódi Szigorú TypeScript Mód: strict, noImplicitAny és strictNullChecks bekapcsolva 0 hibával és 0 figyelmeztetéssel a teljes projektben',
    'CI Titokvédelem & SHA-256 Hash Alapú Vizsgálat: Törölve minden plaintext API kulcs a CI workflow fájlból; helyette hash ujjlenyomat és regex vizsgálat fut',
    'Valódi Dixon–Coles (1997) MLE Paraméter-illesztő Motor: A statikus 17 csapatos TEAM_POWER tábla helyett valós meccsekből illesztett dinamikus csapatparaméterek',
    'Lejátszási Dátum és Időpont Kijelzése Lezárt Meccseknél: A befejezett mérkőzéseken naptárral és órával megjelenik a meccs napja és kezdési ideje',
    'Színátmenetes Hátterek & Enyhe Rácsos Háló: Minden képernyő és kártya modern sötét technológiai színátmenetet és elegáns rácsos hálót kapott',
    '3D Interaktív Forgó Labda: Térbeli forgó szférikus focilabda részecskegyűrűkkel a Hero sávban és a logóban',
  ],
};
