export const APP_VERSION = '1.4.0';
export const APP_RELEASE_NAME = 'Szűrhető Eredmények & Piac-specifikus ROI Archívum';
export const APP_RELEASE_DATE = '2026-10-17';
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
    'Piac-specifikus Szűrés & Elemzés: Külön szűrhető és elemezhető piacok (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5)',
    'Interaktív Piaci Teljesítmény Sáv: 5 db kattintható mini-KPI kártya eseményszámmal, sikerességgel és piaci ROI%-kal',
    'Virtuális ROI & Profit Szimulátor: 10 000 Ft-os egységtéttel számított tiszta nyereség és tőkearányos megtérülés',
    'Többszintű Szűrőrendszer: Státusz szerinti gyorsválasztó (Mind, Nyert, Vesztes) és bajnokság szerinti szűrés',
    'Élő Bukmékeri Oddsok: Pinnacle (éles záró árak) és Bet365 valós szorzók összevetése a modell fair értékeivel',
    'Mobilos Kompakt Kártyanézet (MatchCardsList) és táblázat/kártya nézetváltó',
  ],
};
