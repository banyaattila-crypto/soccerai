export const APP_VERSION = '1.7.0';
export const APP_RELEASE_NAME = 'Biztonsági Audit, Egzakt Matematikai Mag & CI Védőháló';
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
    'Titokmentes Kód & Lezárt Proxyk: Beégetett API kulcsok eltávolítása a forrásból és bundle-ből (.env.local), szigorú CORS origin-ellenőrzés (403), paraméter-validáció (400) és IP rate-limit (429) a Vercel proxykon',
    'Őszinte Feliratok & Demó Adat Jelző: Szimulált / becsült odds és ROI megjelölés, valós idejű „Demó adat” figyelmeztető sáv tartalék adatok használatakor',
    'Piacfüggő Robusztussági Teszt & Egzakt Mátrix: A robustnessGridTest az adott piacot (1/X/2, Over 2.5, BTTS, BTTS+Over 2.5) vizsgálja a λ-rácson; a közös BTTS & Over 2.5 esély egzaktul a Dixon–Coles mátrixból számolódik, dupla hazai előny nélkül',
    'Egységes Dátumkezelés & 3 Napos API Ablak: Helyi időzóna-helyes dátumozás (dateUtils.ts), 3 napos (Tegnap–Ma–Holnap) Football-Data lekérés és a Ma fül átszivárgásának javítása',
    'Network-First Service Worker & Frissítési Sáv: Az index.html navigáció mindig hálózatról frissül, új verzió esetén pedig azonnali egykattintásos frissítő sáv jelenik meg',
    'Reprodukálható Lockfile & GitHub Actions CI: Verziózott package-lock.json és automatikus CI munkafolyamat (npm ci, tsc -b, oxlint, vite build, kulcsszivárgás-ellenőrzés)',
  ],
};
