export const APP_VERSION = '1.34.0';
export const APP_RELEASE_NAME = 'Bemutató Szelvények Nélkül';
export const APP_RELEASE_DATE = '2026-10-23';
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
    'A Tétnapló bemutató (minta) szelvényei megszűntek: nincs "Minta visszaállítás" gomb, az üres állapot a kézi tét rögzítésére visz; a korábban betöltött bet-sample-* szelvények egyszeri takarítással törlődnek, a saját tétek maradnak',
    'Szerkezeti tisztítás: az élő bukmékeri odds szekció (LiveOddsSection + tesztelt oddsRows), a tétnapló szelvénykártyája (TrackedBetCard) és a kézi tét ablak (ManualBetModal) külön komponens',
    'MatchDetailModal 868 -> 593 sor, BankrollView 868 -> 508 sor',
    '312 / 312 zöld teszt (35 tesztfájl)',
  ],
};
