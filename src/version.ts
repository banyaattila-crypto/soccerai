export const APP_VERSION = '1.24.1';
export const APP_RELEASE_NAME = 'Kétszintes Tágas Fejléc & Prémium Navigációs Architektúra';
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
    'Kétszintes Fejléc Újratervezés (Header.tsx): A márkaelemek (3D labda logó, SoccerAI PRO cím, verziószám, élő API státusz) és a globális műveletgombok különváló, tágas felső szintje',
    'Zavartalan és Áttekinthető Navigáció: Dedikált, középre igazított második navigációs sáv a 6 fő nézethez, teljesen megszüntetve a logó és a gombok átfedését vagy összenyomódását',
    'Teljes Reszponzivitás: Mobilon kompakt 6-oszlopos rács, tableten és asztali monitorokon prémium glassmorphism tab-sáv',
    '196 / 196 Zöld Egységteszt: 17 tesztcsomag, 0 hiba és 0 figyelmeztetés az oxlint és TypeScript strict ellenőrzéseken',
  ],
};
