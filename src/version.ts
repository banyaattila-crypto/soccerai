export const APP_VERSION = '1.9.0';
export const APP_RELEASE_NAME = 'Valódi Dixon–Coles MLE Motor & Dinamikus Csapatparaméterek';
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
    '3D Interaktív Forgó Labda & 3D Kártya Döntés: Valódi 3D térbeli forgó focilabda widget (ThreeDBall) orbitális részecskegyűrűkkel a Hero szekcióban és a Logóban, valamint interaktív egérmozgásra reagáló 3D perspektíva dőlés a Top 3 kártyákon',
    'Finomított Színvilág & Túl Sok Sárga Eltávolítása: Harsány neonsárga helyett professzionális smaragdzöld (emerald-600) akciógombok, elegáns sötét pala és zafír navigáció, az arany akcentusok diszkrét célzott használata',
    'Tartós Múltbeli Eredmény Archívum (historyService.ts): A lezárt mérkőzések többé nem vesznek el az idő múlásával; a böngésző helyi tárhelye automatikusan megőrzi és felhalmozza őket, időszaki szűrőkkel (Összes, Ma, Tegnap, 7 nap)',
    'Szigorú Top Pick Szűrés (Nincs több ELVETVE a Top 3-ban): A λ-rácson instabilnak minősülő ELVETVE tippek kizárásra kerültek a kiemelt ajánlások közül; csak sziklaszilárd ROBUSZTUS vagy valószínű tippek jelenhetnek meg',
    'Állandó Fogadási Szelvény Tárolás (Draft Persistence): Az összeállított szelvénytervezet a böngésző tárában (localStorage) korlátlan ideig megmarad oldalfrissítés vagy PWA újraindítás után is',
    'Gördíthető Beállítások Modal & Dedikált Vissza Gombok: Max. 90vh képernyőméretezés overscroll-contain gördítéssel, világos „← Vissza” navigációval a fejlécben és a láblécben',
    'Teljes Szélességű Bajnokság Választó & Görgető Nyilak: A ligachipek többé nem vágódnak le a LaLiga után; dedikált sáv bal/jobb görgetőgombokkal és „Összes liga kibontása” több soros váltóval',
  ],
};
