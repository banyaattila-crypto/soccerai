export const APP_VERSION = '1.19.0';
export const APP_RELEASE_NAME = 'Valós Bukméker Oddsok, Lejárat (TTL) és Szimulált Ár Védelem';
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
    'Valós Bukméker Oddsok Bekötése: Élő Pinnacle és Bet365 oddsok közvetlen bekötése minden ajánlási nézetbe (TopPicks, Scanner, StatsGrid, BetSlip, MatchDetailModal) valós bukméker névvel és 60 perces lejárati idővel (TTL)',
    'Szimulált Ár Védelem: A szimulált és becsült árak esetén a Value (+EV%) és Kelly-tét kijelzés szigorúan le van tiltva (0.0%), megelőzve az önigazoló arbitrázs illúzióját',
    'Odds Lejárat & Frissesség Kezelés: Valós lejárati visszaszámláló (TTL perc), lejárt odds esetén a fogadási él automatikusan zárolásra kerül az újrafrissítésig',
    'Scanner Valós Odds Szűrő: Új dedikált szűrő a Scannerben („Csak Valós Oddsok”), a best_ev preset pedig kizárólag igazolt, nem lejárt piaci szorzókat listáz',
    '11 Új Dedikált Regressziós Teszt: Összesen 123/123 egységteszt védi a bukmékeri oddsokat és a numerikus invariánsokat',
  ],
};
