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
const SEASON_REGEX = /^\d{4}$/;

// Memóriabeli rate limit (max 30 kérés / perc / IP, legfeljebb 1000 egyidejű IP nyomon követése memóriatúlcsordulás ellen)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;
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
    'Accept, Content-Type, X-Auth-Token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Csak GET kérések engedélyezettek.' });
  }

  // Rate limit ellenőrzés
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

  const headerToken = Array.isArray(req.headers['x-auth-token'])
    ? req.headers['x-auth-token'][0]
    : req.headers['x-auth-token'];
  const token = headerToken?.trim() || process.env.FOOTBALL_DATA_API_KEY;

  if (!token) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error:
        'Hiányzó szerveroldali API-kulcs (FOOTBALL_DATA_API_KEY). Állítsd be a Vercel környezeti változók között vagy a Beállításokban!',
    });
  }

  const rawDateFrom = req.query?.dateFrom;
  const rawDateTo = req.query?.dateTo;
  const rawCompetition = req.query?.competition;
  const rawStatus = req.query?.status;
  const rawSeason = req.query?.season;

  const dateFrom = Array.isArray(rawDateFrom) ? rawDateFrom[0] : rawDateFrom;
  const dateTo = Array.isArray(rawDateTo) ? rawDateTo[0] : rawDateTo;
  const competition = Array.isArray(rawCompetition) ? rawCompetition[0] : rawCompetition;
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const season = Array.isArray(rawSeason) ? rawSeason[0] : rawSeason;

  if (dateFrom && !DATE_REGEX.test(dateFrom)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({
      error: 'Érvénytelen dateFrom paraméter formátum (YYYY-MM-DD szükséges).',
    });
  }
  if (dateTo && !DATE_REGEX.test(dateTo)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({
      error: 'Érvénytelen dateTo paraméter formátum (YYYY-MM-DD szükséges).',
    });
  }

  if (season && !SEASON_REGEX.test(season)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({
      error: 'Érvénytelen season paraméter formátum (négyjegyű évszám szükséges).',
    });
  }

  let url: string;
  let cacheTtl = 's-maxage=120, stale-while-revalidate=300';

  if (competition) {
    const sanitizedComp = competition.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
    url = `https://api.football-data.org/v4/competitions/${sanitizedComp}/matches`;
    const compParams = new URLSearchParams();
    if (status) compParams.append('status', status);
    if (season) compParams.append('season', season);
    if (compParams.toString()) url += `?${compParams.toString()}`;
    // Bajnokság szintű meccslista (szezon előzmények): 24 órás Edge cache
    cacheTtl = 's-maxage=86400, stale-while-revalidate=172800';
  } else {
    url = 'https://api.football-data.org/v4/matches';
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
  }

  try {
    const apiRes = await fetch(url, {
      headers: {
        'X-Auth-Token': token,
      },
    });

    let data: unknown;
    try {
      data = await apiRes.json();
    } catch {
      data = { error: `Football-Data válasz feldolgozási hiba (HTTP ${apiRes.status})` };
    }

    if (apiRes.ok) {
      // Csak sikeres (2xx) válasznál engedélyezzük a CDN Edge gyorsítótárazást
      res.setHeader('Cache-Control', cacheTtl);
    } else {
      // Átmeneti upstream hiba (pl. 429 Too Many Requests, 500, 502, 503) esetén szigorúan no-store
      res.setHeader('Cache-Control', 'no-store');
    }
    return res.status(apiRes.status).json(data);
  } catch (error: unknown) {
    res.setHeader('Cache-Control', 'no-store');
    const message =
      error instanceof Error ? error.message : 'Hiba a mérkőzések lekérésekor';
    return res.status(500).json({ error: message });
  }
}
