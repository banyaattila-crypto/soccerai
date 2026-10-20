export const APP_VERSION = '1.20.0';
export const APP_RELEASE_NAME = 'Kvóta-, Státusz- és Szelvény Integritás Stabilizáció';
export const APP_RELEASE_DATE = '2026-10-20';
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
    'API Kvóta & Rate Limit Védelem: Intelligens csúszóablak (Football-Data 10 req/min) és napi limit menedzser (API-Sports 100 req/nap) automatikus 429 backoff-fal és hiba esetén megmentő gyorsítótárral (stale cache), hogy meccsek soha ne tűnjenek el a képernyőről',
    'Mérkőzés Státusz Stabilizáció: Teljes és pontos leképezés a POSTPONED (elhalasztott), CANCELLED (törölt) és SUSPENDED (félbeszakadt) állapotokra; ezen meccsekre a fogadás szigorúan le van tiltva',
    'Kriptográfiai Audit Napló & Tétnapló Import: Tamper-evident SHA-256 integritás-ellenőrzés a kezdés előtti predikciónapló biztonságos mentéséhez és visszaállításához, valamint robusztus tétnapló séma-validáció',
    'Szelvény Integritás & Tisztítás: Automatikus élő szinkronizáció, elkezdődött és lezárt mérkőzések detektálása, azonnali tisztító gomb (🧹 Érvénytelenek eltávolítása), és mentésvédelem érvénytelen események esetén',
    '12 Új Dedikált Regressziós Teszt: Összesen 135/135 egységteszt védi a kvótát, státuszokat, importot és a szelvény integritását',
  ],
};
