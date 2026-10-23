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


const ID_REGEX = /^\d{1,8}$/;
const SEASON_REGEX = /^\d{4}(-\d{4})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ENDPOINTS: Record<string, string> = {
  next: 'eventsnextleague.php',
  past: 'eventspastleague.php',
  season: 'eventsseason.php',
  day: 'eventsday.php',
};

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
  const originHeader = Array.isArray(req.headers['origin']) ? req.headers['origin'][0] : req.headers['origin'];

  if (!isRequestAllowed(req.headers)) {
    return res.status(403).json({ error: 'Hozzáférés megtagadva: nem engedélyezett vagy hiányzó Origin (CORS védelem).' });
  }
  if (originHeader) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Csak GET kérések engedélyezettek.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(429).json({ error: 'Túl sok kérés. Kérlek várj egy percet az újrapróbálkozás előtt.' });
  }

  const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
  const kind = first(req.query?.kind) ?? '';
  const league = first(req.query?.league);
  const season = first(req.query?.season);
  const day = first(req.query?.date);
  const file = ENDPOINTS[kind];

  const bad = (error: string) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error });
  };
  if (!file) return bad('Érvénytelen kind paraméter (next, past, season vagy day).');
  if (kind === 'day') {
    if (!day || !DATE_REGEX.test(day)) return bad('Érvénytelen date paraméter (YYYY-MM-DD).');
  } else {
    if (!league || !ID_REGEX.test(league)) return bad('Érvénytelen league paraméter.');
    if (kind === 'season' && (!season || !SEASON_REGEX.test(season))) return bad('Érvénytelen season paraméter.');
  }

  // Kulcs hiányában a nyilvános, erősen korlátozott teszt-kulcs (123) marad
  const key = process.env.THE_SPORTS_DB || process.env.THESPORTSDB_KEY || '123';
  const qs =
    kind === 'day'
      ? `d=${day}&s=Soccer`
      : kind === 'season'
      ? `id=${league}&s=${season}`
      : `id=${league}`;

  try {
    const apiRes = await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/${file}?${qs}`);
    let data: unknown;
    try {
      data = await apiRes.json();
    } catch {
      data = { error: `TheSportsDB válasz feldolgozási hiba (HTTP ${apiRes.status})` };
    }
    res.setHeader('X-Sportsdb-Key', key === '123' ? 'test' : 'custom');
    res.setHeader('Cache-Control', apiRes.ok ? 's-maxage=1800, stale-while-revalidate=3600' : 'no-store');
    return res.status(apiRes.status).json(data);
  } catch (error: unknown) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Hiba a TheSportsDB lekérésekor' });
  }
}
