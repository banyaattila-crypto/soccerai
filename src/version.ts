export const APP_VERSION = '1.22.2';
export const APP_RELEASE_NAME = 'Cellaszintű Kelly-tétméretezés Javítás a Mérkőzés Rácsban';
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
    'Cellaszintű Kelly-tétméretezés (StatsGrid handleCellBet): A rács bármely cellájára (pl. Döntetlen X, Over, BTTS) kattintva a rendszer szigorúan az adott cella saját oddsából és valószínűségéből számítja ki a Kelly-értéket',
    'Fals Tétméretezés Megakadályozása: Más kimenetelek (pl. Hazai győzelem) magas Kelly-százaléka már nem szivároghat át ellentétes vagy negatív EV-s piacokra',
    'Piac-specifikus Bukméker Párosítás: A szelvényre a kattintott piac legjobb valós bukmékere (Pinnacle, Bet365, stb.) kerül át',
    'API-Sports Gyorsítótár-takarítás & 3D Nyomógombok: Megújított localStorage takarítás és elegáns 3D aranykeretes kezelőszervek',
    '151 / 151 Zöld Regressziós Teszt: Teljes lefedettség a cellaszintű tétméretezésre és invariánsokra',
  ],
};
