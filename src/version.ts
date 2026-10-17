export const APP_VERSION = '1.2.1';
export const APP_RELEASE_NAME = 'Mobilos Kompakt Kártyanézet & Nézetváltó';
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
    'Mobilos Kompakt Kártyanézet (MatchCardsList) a széles táblázat vízszintes görgetésének kiváltására',
    'Nézetváltó gombpár (Táblázat 📊 vs Kártyák 🃏) a Mérkőzés Rács szűrősávjában',
    'API-Sports integráció: LaLiga 2, Ligue 2, Serie B, 2. Bundesliga és NB I 45 perces kvóta-védelemmel',
    'Kombinált többforrásos mérkőzéslista (~60 valós mérkőzés a főbajnokságokkal együtt)',
    'Diverzifikált piackiválasztás (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5) és valós eredménykiértékelés',
  ],
};
