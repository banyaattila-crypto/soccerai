export const APP_VERSION = '1.3.0';
export const APP_RELEASE_NAME = 'Élő Bukmékeri Oddsok (Pinnacle & Bet365) & Valós Piaci Élek';
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
    'Élő Bukmékeri Oddsok: Pinnacle (éles záró oddsok) és Bet365 valós szorzók az API-Sports /odds végpontról',
    'Piaci Érték (+EV %) és Bukméker Vig kalkuláció 1X2, Over/Under 2.5 és BTTS piacokon',
    'Modell Fair Odds vs Élő Bukméker összehasonlító nézet a meccs részletező kártyán',
    'Szigorú 0 Ft-os kvótavédelem: 60 perces helyi gyorsítótár és igény szerinti lekérés',
    'Mobilos Kompakt Kártyanézet (MatchCardsList) és táblázat/kártya nézetváltó',
    '5 új másodosztályú liga + NB I valós mérkőzéseinek integrációja',
  ],
};
