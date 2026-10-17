export const APP_VERSION = '1.2.0';
export const APP_RELEASE_NAME = 'API-Sports Integráció: LaLiga 2, Ligue 2, Serie B, 2. Bundesliga & NB I';
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
    'API-Sports (API-Football) integráció éles hitelesítéssel és 45 perces intelligens kvóta-védelemmel',
    '5 új másodosztályú és hazai liga: LaLiga 2, Ligue 2, Serie B, 2. Bundesliga és NB I (OTP Bank Liga)',
    'Vercel Serverless Proxy (api/apisports.ts) 30 perces Edge CDN gyorsítótárral a 100 req/day védelmére',
    'Kombinált többforrásos mérkőzéslista (~60 mai valós mérkőzés a főbajnokságokkal együtt)',
    'Beállítások panel másodosztály-kezelővel és ligaválasztó kapcsolóval',
    'Valós eredménykiértékelés (evaluatePickWon) és diverzifikált többpiacos ajánló (BTTS, Over 2.5, 1X2)',
  ],
};
