export const APP_VERSION = '1.10.0';
export const APP_RELEASE_NAME = 'ScoreLab Kvantitatív Mutatósáv, Kompakt Meccslista & My Matches';
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
    'ScoreLab Dupla Dinamikus Statisztika-Választó Sáv: Testreszabható, valós időben váltogatható kvantitatív mutatók (Over 1.5, Over 2.5, BTTS, 1X2, HT 0.5 felett, Under 2.5, BTTS & Over 2.5) a meccssorokon',
    'ScoreLab Stílusú Kompakt Meccslista: Letisztult, mobilbarát horizontális sorok csapatlogókkal, folyamatjelzős (progress bar) valószínűségi pill-ekkel és közvetlen 1-kattintásos szelvényre tevéssel',
    'Mini 1X2 Odds Oszlop: Függőlegesen rendezett mikro odds-gombok minden meccssoron az azonnali fogadásépítéshez',
    '⭐ Kedvenc Mérkőzések (My Matches): Csillaggal kitűzhető kedvenc meccsek, melyek kiemelt arany blokként mindig a lista tetején jelennek meg, perzisztens tárolással',
    'Háromirányú Nézetváltó: Egyetlen kattintással válthatsz Kompakt (ScoreLab), Kártyák és 11-oszlopos Részletes Táblázat nézet között',
    'React Rules of Hooks Helyreállítása: A MatchDetailModal hookjai feltétel nélkül a legfelső szintre kerültek, kiküszöbölve a feltételes hook-hívás kockázatát',
    'Valódi Szigorú TypeScript Mód: strict, noImplicitAny és strictNullChecks bekapcsolva 0 hibával és 0 figyelmeztetéssel a teljes projektben',
  ],
};
