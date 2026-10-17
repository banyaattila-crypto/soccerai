export const APP_VERSION = '1.5.0';
export const APP_RELEASE_NAME = 'PWA Támogatás & Intelligens Offline Működés';
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
    'Progresszív Webalkalmazás (PWA) Támogatás: Mobilra és asztali böngészőbe telepíthető natív standalone alkalmazásként (manifest.json)',
    'Intelligens Service Worker Gyorsítótár: Kettős gyorsítótárazási stratégia (Cache-First statikus eszközökre, Network-First API végpontokra)',
    'Alkalmazáson belüli Telepítési Rendszer: Egy kattintásos közvetlen telepítés gomb a böngészőből és Standalone PWA állapotjelző badge',
    'Nagyfelbontású Vektoros & PNG Ikoncsomag: 192x192 és 512x512 méretű ikonok, Apple Touch Icon és 3D SoccerAI SVG logó',
    'Piac-specifikus Szűrés & Elemzés: Külön szűrhető és elemezhető piacok (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5)',
    'Virtuális ROI & Profit Szimulátor: 10 000 Ft-os egységtéttel számított tiszta nyereség és tőkearányos megtérülés',
  ],
};
