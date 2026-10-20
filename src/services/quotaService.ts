/**
 * API Kvóta és Kérésszám Manager (Rate Limiter & Quota Protection)
 *
 * Football-Data.org: Ingyenes csomag esetén 10 kérés / perc limit.
 * API-Sports: Ingyenes csomag esetén 100 kérés / nap limit.
 *
 * Feladata:
 * 1. Megelőzni a felesleges API hívásokat 429 (Too Many Requests) esetén (intelligens backoff).
 * 2. Nyilvántartani a napi és percenkénti felhasználást a localStorage-ben.
 * 3. Hálózati vagy kvótahiba esetén lehetővé tenni a legfrissebb meglévő gyorsítótár (stale cache) használatát.
 */

export interface QuotaStatus {
  service: 'football-data' | 'api-sports';
  isRateLimited: boolean;
  retryAfterSeconds: number;
  requestsRemaining?: number;
  requestsLimit?: number;
  dailyRemaining?: number;
  dailyLimit?: number;
  backoffUntilMs: number;
  lastErrorNotice?: string;
}

const STORAGE_KEY_FD_QUOTA = 'soccerai_quota_football_data_v1';
const STORAGE_KEY_AS_QUOTA = 'soccerai_quota_apisports_v1';

// Alapértelmezett 429 várakozási idő (60 másodperc)
const DEFAULT_429_BACKOFF_MS = 60 * 1000;

interface StoredQuotaState {
  backoffUntilMs: number;
  timestamps: number[];
  dailyCount: number;
  dailyDate: string; // YYYY-MM-DD
  dailyLimit: number;
  lastErrorNotice?: string;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(key: string, defaultDailyLimit: number): StoredQuotaState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = getTodayDateString();
      if (parsed.dailyDate !== today) {
        parsed.dailyCount = 0;
        parsed.dailyDate = today;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    backoffUntilMs: 0,
    timestamps: [],
    dailyCount: 0,
    dailyDate: getTodayDateString(),
    dailyLimit: defaultDailyLimit,
  };
}

function saveState(key: string, state: StoredQuotaState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Football-Data.org Kvóta Ellenőrzése (10 req/min limit)
 */
export function checkFootballDataQuota(nowMs = Date.now()): QuotaStatus {
  const state = loadState(STORAGE_KEY_FD_QUOTA, 10);

  // 1. Explicit 429 backoff vizsgálat
  if (state.backoffUntilMs > nowMs) {
    const retrySec = Math.ceil((state.backoffUntilMs - nowMs) / 1000);
    return {
      service: 'football-data',
      isRateLimited: true,
      retryAfterSeconds: retrySec,
      backoffUntilMs: state.backoffUntilMs,
      requestsRemaining: 0,
      requestsLimit: 10,
      lastErrorNotice: state.lastErrorNotice || `Football-Data kvótavédelem: Kérlek várj ${retrySec} másodpercet!`,
    };
  }

  // 2. Csúszóablak (utolsó 60 másodperc kérései)
  const windowStart = nowMs - 60 * 1000;
  const recentCalls = state.timestamps.filter((ts) => ts > windowStart);
  const remaining = Math.max(0, 10 - recentCalls.length);

  if (remaining === 0) {
    const oldest = recentCalls[0] || nowMs;
    const retrySec = Math.ceil((oldest + 60 * 1000 - nowMs) / 1000);
    return {
      service: 'football-data',
      isRateLimited: true,
      retryAfterSeconds: Math.max(1, retrySec),
      backoffUntilMs: oldest + 60 * 1000,
      requestsRemaining: 0,
      requestsLimit: 10,
      lastErrorNotice: `Elérted a Football-Data.org 10 lekérés/perc limitjét. Frissítés ${Math.max(1, retrySec)} mp múlva.`,
    };
  }

  return {
    service: 'football-data',
    isRateLimited: false,
    retryAfterSeconds: 0,
    backoffUntilMs: 0,
    requestsRemaining: remaining,
    requestsLimit: 10,
  };
}

/**
 * Football-Data.org Hívás Eredményének Rögzítése
 */
export function recordFootballDataCall(
  httpStatus: number,
  headers?: Headers | Record<string, string>,
  nowMs = Date.now()
): void {
  const state = loadState(STORAGE_KEY_FD_QUOTA, 10);
  const windowStart = nowMs - 60 * 1000;
  state.timestamps = state.timestamps.filter((ts) => ts > windowStart);
  state.timestamps.push(nowMs);

  if (httpStatus === 429) {
    // 429 Too Many Requests -> backoff aktiválása
    let backoffMs = DEFAULT_429_BACKOFF_MS;
    if (headers) {
      const retryHeader = typeof (headers as Headers).get === 'function'
        ? (headers as Headers).get('Retry-After') || (headers as Headers).get('X-RequestCounter-Reset')
        : (headers as Record<string, string>)['Retry-After'] || (headers as Record<string, string>)['retry-after'];
      if (retryHeader) {
        const sec = parseInt(retryHeader, 10);
        if (!isNaN(sec) && sec > 0) backoffMs = sec * 1000;
      }
    }
    state.backoffUntilMs = nowMs + backoffMs;
    state.lastErrorNotice = `HTTP 429 Kvótakorlát (Football-Data.org). Automatikus pihenő: ${Math.ceil(backoffMs / 1000)} mp.`;
  } else if (httpStatus >= 200 && httpStatus < 300) {
    state.backoffUntilMs = 0;
    state.lastErrorNotice = undefined;
  }

  saveState(STORAGE_KEY_FD_QUOTA, state);
}

/**
 * API-Sports Kvóta Ellenőrzése (100 req/day limit)
 */
export function checkApiSportsQuota(nowMs = Date.now()): QuotaStatus {
  const state = loadState(STORAGE_KEY_AS_QUOTA, 100);

  // 1. Explicit 429 backoff vizsgálat
  if (state.backoffUntilMs > nowMs) {
    const retrySec = Math.ceil((state.backoffUntilMs - nowMs) / 1000);
    return {
      service: 'api-sports',
      isRateLimited: true,
      retryAfterSeconds: retrySec,
      backoffUntilMs: state.backoffUntilMs,
      dailyRemaining: Math.max(0, state.dailyLimit - state.dailyCount),
      dailyLimit: state.dailyLimit,
      lastErrorNotice: state.lastErrorNotice || `API-Sports kvótakorlát: Kérlek várj ${retrySec} másodpercet!`,
    };
  }

  // 2. Napi limit vizsgálat
  const dailyRemaining = Math.max(0, state.dailyLimit - state.dailyCount);
  if (dailyRemaining === 0) {
    return {
      service: 'api-sports',
      isRateLimited: true,
      retryAfterSeconds: 3600, // 1 óra / éjfélig
      backoffUntilMs: nowMs + 3600 * 1000,
      dailyRemaining: 0,
      dailyLimit: state.dailyLimit,
      lastErrorNotice: 'A mai 100 API-Sports kéréskeret elfogyott. Gyorsítótárazott adatok aktívak holnapig.',
    };
  }

  return {
    service: 'api-sports',
    isRateLimited: false,
    retryAfterSeconds: 0,
    backoffUntilMs: 0,
    dailyRemaining,
    dailyLimit: state.dailyLimit,
  };
}

/**
 * API-Sports Hívás Eredményének Rögzítése
 */
export function recordApiSportsCall(
  httpStatus: number,
  remainingHeader?: string | number,
  limitHeader?: string | number,
  nowMs = Date.now()
): void {
  const state = loadState(STORAGE_KEY_AS_QUOTA, 100);
  state.dailyCount += 1;

  if (limitHeader !== undefined) {
    const l = Number(limitHeader);
    if (!isNaN(l) && l > 0) state.dailyLimit = l;
  }

  if (remainingHeader !== undefined) {
    const r = Number(remainingHeader);
    if (!isNaN(r) && r >= 0) {
      state.dailyCount = Math.max(0, state.dailyLimit - r);
    }
  }

  if (httpStatus === 429) {
    state.backoffUntilMs = nowMs + DEFAULT_429_BACKOFF_MS;
    state.lastErrorNotice = 'HTTP 429: API-Sports lekérési limit túllépve. Várakozás 60 másodpercig.';
  } else if (httpStatus >= 200 && httpStatus < 300) {
    state.backoffUntilMs = 0;
    state.lastErrorNotice = undefined;
  }

  saveState(STORAGE_KEY_AS_QUOTA, state);
}

/**
 * Mindkét szolgáltató kvóta státuszának együttes lekérdezése
 */
export function getOverallQuotaSummary(nowMs = Date.now()): {
  footballData: QuotaStatus;
  apiSports: QuotaStatus;
  hasActiveRateLimit: boolean;
  activeNotice: string | null;
} {
  const fd = checkFootballDataQuota(nowMs);
  const as = checkApiSportsQuota(nowMs);
  const hasActiveRateLimit = fd.isRateLimited || as.isRateLimited;
  const activeNotice = fd.lastErrorNotice || as.lastErrorNotice || null;

  return {
    footballData: fd,
    apiSports: as,
    hasActiveRateLimit,
    activeNotice,
  };
}

/**
 * Tesztelési célú kvóta alaphelyzetbe állítás
 */
export function resetQuotaStateForTesting(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FD_QUOTA);
    localStorage.removeItem(STORAGE_KEY_AS_QUOTA);
  } catch {
    // ignore
  }
}
