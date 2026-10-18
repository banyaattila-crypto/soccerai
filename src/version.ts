export const APP_VERSION = '1.12.0';
export const APP_RELEASE_NAME = 'Nemzetközi Bajnokságok Bővítése (Primeira Liga, Süper Lig, Jupiler Pro, MLS & Top Európa) & Kereszt-API Deduplikáció';
export const APP_RELEASE_DATE = '2026-10-19';
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
    'Új Bajnokságok Támogatása: Portugál Primeira Liga (Football-Data PPL & API-Sports 94), Belga Jupiler Pro League (144), Török Süper Lig (203), Osztrák Bundesliga (218), Svájci Super League (207), Skót Premiership (179), Lengyel Ekstraklasa (106), Görög Szuperliga (197) és Amerikai MLS (253)',
    'Intelligens Kereszt-API Mérkőzés Deduplikáció (App.tsx): Azonos mérkőzések kiszűrése Football-Data és API-Sports párhuzamos lekérései esetén',
    'Bajnokság-specifikus Dixon-Coles Paraméterek & Valós Gólátlagok: Minden új bajnoksághoz dedikált hazai és vendég gólátlagok és Dixon-Coles Poisson illesztés',
    'Dinamikus Ligaszűrő & Prioritás-Rendezés (StatsGrid.tsx): Az új bajnokságok azonnali megjelenése a ligaválasztó sávban országzászlókkal és meccsszámlálókkal',
    'Szelvény Kiértékelés Teljes Matematikai Javítása (evaluatePickWon): Csapatnévvel ellátott 1X2 piacok és félidős piacok valós lezárása',
    '38 darabos Automatikus Vitest Tesztkészlet és CI integráció',
  ],
};
