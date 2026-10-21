export const APP_VERSION = '1.22.1';
export const APP_RELEASE_NAME = 'API-Sports Gyorsítótár-takarítás (Cache Pruning) & localStorage Védelem';
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
    'Kritikus Gyorsítótár-takarítási Javítás (pruneOldApiSportsCache): Az odds-cache kulcsok előtagja az érvényes ODDS_CACHE_PREFIX (soccerai_odds_cache_) és legacy kulcsokra lett igazítva',
    'Elavult & Legacy Gyorsítótárak Törlése: Automatikusan törli a 24 óránál régebbi oddsokat és a korábbi verziók (soccerai_apisports_cache_v5_, stb.) megmaradt adatait',
    'Automatikus Helyfelszabadítás QuotaExceededError esetén: A setItem hibája esetén azonnali agresszív takarítás és újrapróbálás fut le a böngésző 5 MB-os keretének védelmében',
    '3D Nyomógomb Rendszer & Finom Aranykeret: Minden interaktív gomb megkülönböztetett, precíz vékony aranykeretet és felső fényélt visel',
    'Dedikált Regressziós Tesztcsomag: 4 új egységteszttel bővítve (149/149 zöld teszt), oxlint 0 hiba/figyelmeztetés',
  ],
};
