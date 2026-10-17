export const APP_VERSION = '1.0.0';
export const APP_RELEASE_NAME = 'SoccerAI PRO Initial Production Release';
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
    'Élő Football-Data.org API integráció & Vercel Edge caching',
    'Dixon–Coles (1997) korrigált Poisson gólmátrix (ρ = -0.13)',
    'Shin (1992) de-vigging bukmékeri árrés és kedvenc-torzítás szűrés',
    'λ-rács robusztussági szűrő & Negyed-Kelly tétméretezés',
    '3D SoccerAI vektoros logó & mobilos érintésvédelmi fixek',
    'Dinamikus ligaszűrő 39 valós európai mérkőzéshez',
    '10 perces automata háttérfrissítés aktív fül mellett',
  ],
};
