export const APP_VERSION = '1.24.0';
export const APP_RELEASE_NAME = '6-jegyű Kriptográfiai PIN Kód Védelem & Alkalmazás Zárolás';
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
    '6-jegyű Kriptográfiai PIN Kód Védelem (pinService.ts): Sózott SHA-256 jelszóhashelés és szigorú 6-jegyű formátumellenőrzés a bankroll és stratégiák védelmére',
    'Teljes Képernyős Modern Zárolás (PinLockScreen.tsx): Glassmorphism mesh felület, vizuális LED pontok, taktilis virtuális számbillentyűzet és fizikai billentyűzet-támogatás',
    'Brute-Force & Rate Limiting Fék: 5 egymást követő hibás próbálkozás után 30 másodperces automatikus kizárási visszaszámláló',
    'Beállítások Kezelőfelület (SettingsModal.tsx): PIN aktiválás, megerősítés, biztonságos módosítás és jelszóval védett kikapcsolás',
    'Fejléc Gyorsgomb (Header.tsx): Azonnali 🔒 lezárás lehetősége és oldalfrissítéskori automatikus biztonsági zár',
    '196 / 196 Zöld Egységteszt: 17 tesztcsomag, 0 hiba és 0 figyelmeztetés az oxlint és TypeScript strict ellenőrzéseken',
  ],
};
