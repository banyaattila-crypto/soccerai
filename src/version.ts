export const APP_VERSION = '1.11.0';
export const APP_RELEASE_NAME = 'Szelvény Kiértékelés & Pénzkövetés Javítás, Vitest Tesztkészlet, Korreláció Védelem & Bundle Optimalizálás';
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
    'Szelvény Kiértékelés Teljes Matematikai Javítása (evaluatePickWon): Csapatnévvel ellátott 1X2 piacok (pl. "Arsenal (1)", "Chelsea (2)") pontos illesztése; az ismeretlen piacok többé nem esnek tévesen Over 2.5-re',
    'Félidős Piacok (FH_OVER_05) Eredeti Félidős Eredménnyel Történő Kiértékelése: Valós félidős gólok figyelembevétele, hiányzó adat esetén nem tekinti a 2. félidős gólokat 1. félidősnek',
    '38 darabos Automatikus Vitest Tesztkészlet: Dixon-Coles Poisson eloszlás, Shin odds devigging, Kelly-kritérium, robusztussági szimuláció és bankroll auto-kiértékelés 100%-os lefedettséggel',
    'Korrelált Piacok és Szelvény Figyelmeztetés (BetSlipDrawer): Egyazon mérkőzésből választott kimenetelek észlelése és figyelmeztető jelzés megjelenítése a független szorzási torzítás elkerülésére',
    'Élő API és Szimulált Adatforrás Kijelzés (Header): Transzparens státuszjelző badge a fejlécben az aktív adatfolyam típusáról',
    'Dinamikus Erős Szignál Küszöb (SettingsModal -> StatsGrid): A beállításokban megadott küszöbérték (pl. 65%, 70%) azonnal és reaktívan vezérli a kiemelt jelek szűrését és számlálóit',
    'Tárhely Kvóta Védelem: Archív mérkőzéstörténet (max 150) és elavult napi API-Sports cache kulcsok automatikus takarítása a localStorage megtelése ellen',
    'Kódméret Optimalizálás & Lazy Loading: Súlyos modális ablakok és nézetek dinamikus React.lazy betöltése a gyorsabb kezdeti renderelésért',
  ],
};
