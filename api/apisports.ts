export interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  url?: string;
}

export interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    end(): void;
    json(body: unknown): void;
  };
}

declare const process: {
  env: Record<string, string | undefined>;
};

const ALLOWED_ORIGINS = new Set([
  'https://soccerai-pro.vercel.app',
  'https://soccerai-pink.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const FIXTURE_ID_REGEX = /^\d{1,10}$/;

// Memóriabeli rate limit (max 25 kérés / perc / IP, legfeljebb 1000 egyidejű IP nyomon követése memóriatúlcsordulás ellen)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 25;
const MAX_RATE_LIMIT_IPS = 1000;

function pruneRateLimitMap(now: number): void {
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
  if (rateLimitMap.size >= MAX_RATE_LIMIT_IPS) {
    const overflow = rateLimitMap.size - MAX_RATE_LIMIT_IPS + 1;
    let deleted = 0;
    for (const ip of rateLimitMap.keys()) {
      rateLimitMap.delete(ip);
      deleted++;
      if (deleted >= overflow) break;
    }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size >= MAX_RATE_LIMIT_IPS) {
    pruneRateLimitMap(now);
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

/** Az API-Sports állapotkódjai, amelyek zajló mérkőzést jelölnek (első/második félidő, szünet, hosszabbítás, tizenegyesek). */
const LIVE_STATUS_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);

function hasLiveFixtures(data: unknown): boolean {
  const response = (data as { response?: unknown } | null)?.response;
  if (!Array.isArray(response)) return false;
  return response.some((f) => {
    const short = (f as { fixture?: { status?: { short?: string } } })?.fixture?.status?.short;
    return typeof short === 'string' && LIVE_STATUS_CODES.has(short);
  });
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  // Csak a saját éles/fejlesztői origin: a Vercel preview-k same-origin hívásnál Sec-Fetch-Site alapján átmennek,
  // idegen (soccerai*.vercel.app nevű) projekt oldala viszont nem érheti el a szerveroldali kulcsot
  return ALLOWED_ORIGINS.has(origin);
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const v = headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/**
 * Böngészőből érkező, saját oldalról induló kérés-e. Az `Origin` fejléc same-origin GET-nél gyakran hiányzik, ezért
 * ilyenkor a böngésző `Sec-Fetch-Site` fejlécét, régi böngészőknél a `Referer` forrását nézzük. Egyik sem hiányozhat:
 * a fejléc nélküli (pl. curl-szerű) hívás nem jut a szerveroldali API-kulcshoz. Ez nem hitelesítés, a fejlécek
 * nem böngészőből hamisíthatók; a szándékos visszaélés ellen a Vercel Firewall rate limit a megfelelő eszköz.
 */
function isRequestAllowed(headers: Record<string, string | string[] | undefined>): boolean {
  const origin = headerValue(headers, 'origin');
  if (origin) return isOriginAllowed(origin);
  const site = headerValue(headers, 'sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'same-site' || site === 'none';
  const refererOrigin = originOf(headerValue(headers, 'referer'));
  return refererOrigin ? isOriginAllowed(refererOrigin) : false;
}

/**
 * Ismeretlen lekérdezési paraméter esetén 400: a Vercel gyorsítótár kulcsa a teljes URL, ezért egy tetszőleges
 * extra paraméterrel (pl. `&x=1`, `&x=2`) kikerülhető a gyorsítótár, és minden kérés a szolgáltató havi/napi
 * keretét fogyasztaná. A megengedett paramétereken kívüli kérés a szolgáltatóig el sem jut.
 */
function hasUnknownParams(query: Record<string, string | string[] | undefined> | undefined, allowed: string[]): boolean {
  return Object.keys(query ?? {}).some((k) => !allowed.includes(k));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const originHeader = Array.isArray(req.headers['origin'])
    ? req.headers['origin'][0]
    : req.headers['origin'];

  if (!isRequestAllowed(req.headers)) {
    return res.status(403).json({
      error: 'Hozzáférés megtagadva: nem engedélyezett vagy hiányzó Origin (CORS védelem).',
    });
  }

  if (originHeader) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Accept, Content-Type, x-apisports-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Csak GET kérések engedélyezettek.' });
  }

  if (hasUnknownParams(req.query, ['date', 'fixture', 'endpoint'])) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Ismeretlen lekérdezési paraméter.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ||
    'unknown';
  if (!checkRateLimit(clientIp)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(429).json({
      error: 'Túl sok kérés. Kérlek várj egy percet az újrapróbálkozás előtt.',
    });
  }

  const headerToken = Array.isArray(req.headers['x-apisports-key'])
    ? req.headers['x-apisports-key'][0]
    : req.headers['x-apisports-key'];
  const token = headerToken?.trim() || process.env.API_SPORTS_KEY;

  if (!token) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error:
        'Hiányzó szerveroldali API-kulcs (API_SPORTS_KEY). Állítsd be a Vercel környezeti változók között vagy a Beállításokban!',
    });
  }

  const rawDate = req.query?.date;
  const rawFixture = req.query?.fixture;
  const rawEndpoint = req.query?.endpoint;

  const date = Array.isArray(rawDate) ? rawDate[0] : rawDate;
  const fixture = Array.isArray(rawFixture) ? rawFixture[0] : rawFixture;
  const endpoint = Array.isArray(rawEndpoint) ? rawEndpoint[0] : rawEndpoint;

  if (endpoint && !['odds', 'fixtures', 'injuries', 'lineups'].includes(endpoint)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({
      error: 'Érvénytelen endpoint paraméter (odds, fixtures, injuries vagy lineups támogatott).',
    });
  }

  // Meccs-kontextus (hiányzók, felállások): a hiányzók lassan változnak, a felállás a kezdés előtt ~1 órával jelenik meg
  const contextEndpoint = endpoint === 'injuries' ? 'injuries' : endpoint === 'lineups' ? 'fixtures/lineups' : null;
  let url: string;
  if (contextEndpoint) {
    if (!fixture || !FIXTURE_ID_REGEX.test(fixture)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({ error: 'Érvénytelen fixture paraméter (pozitív egész szám szükséges).' });
    }
    url = `https://v3.football.api-sports.io/${contextEndpoint}?fixture=${fixture}`;
  } else if (endpoint === 'odds' || fixture) {
    if (!fixture || !FIXTURE_ID_REGEX.test(fixture)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({
        error: 'Érvénytelen fixture paraméter (pozitív egész szám szükséges).',
      });
    }
    url = `https://v3.football.api-sports.io/odds?fixture=${fixture}`;
  } else {
    const now = new Date();
    const fallbackDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const targetDate = date || fallbackDate;
    if (!DATE_REGEX.test(targetDate)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({
        error: 'Érvénytelen date paraméter formátum (YYYY-MM-DD szükséges).',
      });
    }
    url = `https://v3.football.api-sports.io/fixtures?date=${targetDate}`;
  }

  try {
    const apiRes = await fetch(url, {
      headers: {
        'x-apisports-key': token,
      },
    });

    let data: unknown;
    try {
      data = await apiRes.json();
    } catch {
      data = { error: `API-Sports válasz feldolgozási hiba (HTTP ${apiRes.status})` };
    }

    for (const h of ['x-ratelimit-requests-remaining', 'x-ratelimit-requests-limit']) {
      const v = apiRes.headers?.get?.(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader('Access-Control-Expose-Headers', 'x-ratelimit-requests-remaining, x-ratelimit-requests-limit');

    const errs = (data as { errors?: unknown } | null)?.errors;
    const hasBodyErrors =
      !!errs && typeof errs === 'object' && Object.values(errs as Record<string, unknown>).some(Boolean);

    if (hasBodyErrors) {
      // Fiók- vagy kvótahiba HTTP 200-zal: nem gyorsítótárazható, különben a javítás után is a hibát kapnánk
      res.setHeader('Cache-Control', 'no-store');
    } else if (apiRes.ok && contextEndpoint) {
      res.setHeader(
        'Cache-Control',
        endpoint === 'lineups' ? 's-maxage=600, stale-while-revalidate=600' : 's-maxage=3600, stale-while-revalidate=3600'
      );
    } else if (apiRes.ok) {
      // Élő mérkőzést tartalmazó menetrendnél rövidebb (7 perces) Edge gyorsítótár, hogy a lefújás időben
      // megjelenjen; egyébként 30 perc a napi 100 kérés védelmére. Csak sikeres (2xx) válasznál.
      if (hasLiveFixtures(data)) {
        res.setHeader('Cache-Control', 's-maxage=420, stale-while-revalidate=60');
      } else {
        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
      }
    } else {
      // Átmeneti upstream hiba (pl. 429 Too Many Requests, 500, 502, 503) esetén szigorúan no-store
      res.setHeader('Cache-Control', 'no-store');
    }
    return res.status(apiRes.status).json(data);
  } catch (error: unknown) {
    res.setHeader('Cache-Control', 'no-store');
    const message =
      error instanceof Error
        ? error.message
        : 'Hiba az API-Sports mérkőzések lekérésekor';
    return res.status(500).json({ error: message });
  }
}
