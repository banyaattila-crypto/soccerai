export const APP_VERSION = '1.14.0';
export const APP_RELEASE_NAME = 'Kvantitatív Értékkereső (Scanner), +EV Élek & Bajnokság Statisztikai Radar';
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
    'Kvantitatív Értékkereső (ScannerView): Automatikus piaci lehetőség-kereső valós bukmékeri és szimulált szorzók alapján, közvetlen szelvényre tevéssel',
    '8 Intelligens Presets: 💎 +EV Értéktippek, 🎯 Kiemelt MI Tippek, ⚽ Over 2.5 Gólradar, 🥅 Mindkét Csapat Lő (BTTS), 🛡️ Erős Favoritok, ⚡ 1. Félidő Gól, 💣 Értékes Meglepetések és Összes lehetőség',
    'Dinamikus Szűrők & Rendezés: Csapat/liga kereső, bajnokság választó, minimum esély küszöb (50%+, 60%+, 70%+) és 5-irányú rendezés (+EV, Valószínűség, Odds, Kelly tétméret, Időpont)',
    'Bajnokság Statisztikai Radar: A ligák összehasonlító ranglistája átlagos várható gólok (xG), Over 2.5 gyakoriság, BTTS arány és top meccs alapján',
    'Új Scanner Tab a Navigációban: Mind asztali nézetben, mind a mobil 6-oszlopos gombsorban közvetlen hozzáférés',
    '48 darabos Automatikus Vitest Tesztkészlet (3 új scanner teszttel) és 0 Oxlint figyelmeztetés',
  ],
};
