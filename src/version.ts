export const APP_VERSION = '1.6.0';
export const APP_RELEASE_NAME = 'Saját Bankroll Követő & Tétnapló (Bet Tracker)';
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
    'Saját Bankroll & Tétnapló (Bet Tracker): Dinamikus egyenleg, testreszabható kezdőtőke, valós idejű nettó profit és személyes ROI (%) kalkulátor',
    'Közvetlen Szelvény Rögzítés: Egy kattintásos elmentés a Szelvényépítőből, Negyed-Kelly kockázati kitettség figyelmeztetővel és egyedi jegyzetekkel',
    'Automatikus Szelvény Kiértékelés: A mérkőzés adatbázis befejezett meccsei alapján a függőben lévő szelvények és szelvényesemények azonnali zárása és profit-elszámolása',
    'Rugalmas Kézi Tét Rögzítés: Tetszőleges külső mérkőzések, oddsok és piacok gyors manuális felvitele a tétnaplóba',
    'Adatmentés & Biztonság: Teljes tétnapló exportálása és importálása JSON formátumban, bemutató mintaadatok és tőke-átírás egyetlen kattintással',
    '5-oszlopos Navigáció & Élő Bankroll Kijelző: Dinamikus egyenleg chip a fejlécben és reszponzív mobil tab-elrendezés',
  ],
};
