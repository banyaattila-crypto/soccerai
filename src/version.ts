export const APP_VERSION = '1.23.1';
export const APP_RELEASE_NAME = 'Szimulált vs. Bukméker Odds Oktató Bővítés & Anti-Fake Value Transzparencia';
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
    'Módszertan Oktató Bővítés (7. fejezet): Új, részletes fejezet a MethodologyView-ban a 🧪 Szimulált Odds és a 🎯 Bukméker Odds összehasonlításáról és jelentőségéről',
    'Anti-Fake Value Tőkévédelmi Etika: Transzparens dokumentáció arról, miért tiltja le a rendszer szigorúan a Value (+EV%) és Kelly tét kalkulációt szimulált árakon az öncsalás elkerülésére',
    'Élő Piaci Odds-Feed Útmutató: Lépésről lépésre bemutatott Bet365 / Pinnacle élő bukmékeri oddsbetöltés és 30 perces TTL lejárati folyamat',
    '184 / 184 Zöld Egységteszt: 16 tesztfájl, 0 hiba és 0 figyelmeztetés az oxlint és TypeScript strict ellenőrzéseken',
  ],
};
