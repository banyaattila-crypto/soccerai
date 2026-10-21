export const APP_VERSION = '1.23.0';
export const APP_RELEASE_NAME = 'Moduláris Grid Architektúra, Típusbiztos EventBus & Serverless Biztonság';
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
    'StatsGrid Dekompozíció (1978 sor -> 1084 sor): MatchTable, MatchCardsList, MatchCompactList és types modulok szétválasztása a src/components/grid/ alá',
    'Típusbiztos Reaktivitás & EventBus (src/utils/eventBus.ts): Eseményvezérelt kommunikáció és useEventBus hook nyers window.dispatchEvent helyett, transzparens visszafelé kompatibilis híddal',
    '3D Canvas Logika Egységesítése (useSoccerBallCanvas.ts): Fotorealisztikus 3D Trionda meccslabda raycasting és bilineáris textúra-interpoláció megosztása a Logo és ThreeDBall között',
    'Serverless Proxy Biztonság & Memóriakorlát (MAX_RATE_LIMIT_IPS = 1000): DoS-védelem és FIFO/LRU elévülés az api/matches.ts és api/apisports.ts végpontokon, szigorúan típusbiztos VercelRequest és VercelResponse szignatúrákkal',
    '184 / 184 Zöld Egységteszt: 16 tesztfájl, 0 hiba és 0 figyelmeztetés az oxlint és TypeScript strict ellenőrzéseken',
  ],
};
