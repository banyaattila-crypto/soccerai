interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    end(): void;
    json(body: unknown): void;
  };
}

const ALLOWED_ORIGINS = new Set([
  'https://soccerai-pro.vercel.app',
  'https://soccerai-pink.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]);

const VERCEL_PREVIEW_REGEX = /^https:\/\/soccerai[a-z0-9-]*\.vercel\.app$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Egyszerű memóriabeli rate limit (max 30 kérés / perc / IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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
  // Same-origin böngésző kéréseknél az Origin fejléc gyakran üres
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_REGEX.test(origin);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const originHeader = Array.isArray(req.headers['origin'])
    ? req.headers['origin'][0]
    : req.headers['origin'];

  if (!isOriginAllowed(originHeader)) {
    return res.status(403).json({
      error: 'Hozzáférés megtagadva: nem engedélyezett Origin (CORS védelem).',
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
    return res.status(429).json({
      error: 'Túl sok kérés. Kérlek várj egy percet az újrapróbálkozás előtt.',
    });
  }

  const headerToken = Array.isArray(req.headers['x-auth-token'])
    ? req.headers['x-auth-token'][0]
    : req.headers['x-auth-token'];
  const token = headerToken?.trim() || process.env.FOOTBALL_DATA_API_KEY;

  if (!token) {
    return res.status(503).json({
      error:
        'Hiányzó szerveroldali API-kulcs (FOOTBALL_DATA_API_KEY). Állítsd be a Vercel környezeti változók között vagy a Beállításokban!',
    });
  }

  const rawDateFrom = req.query?.dateFrom;
  const rawDateTo = req.query?.dateTo;
  const rawCompetition = req.query?.competition;
  const rawStatus = req.query?.status;

  const dateFrom = Array.isArray(rawDateFrom) ? rawDateFrom[0] : rawDateFrom;
  const dateTo = Array.isArray(rawDateTo) ? rawDateTo[0] : rawDateTo;
  const competition = Array.isArray(rawCompetition) ? rawCompetition[0] : rawCompetition;
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;

  if (dateFrom && !DATE_REGEX.test(dateFrom)) {
    return res.status(400).json({
      error: 'Érvénytelen dateFrom paraméter formátum (YYYY-MM-DD szükséges).',
    });
  }
  if (dateTo && !DATE_REGEX.test(dateTo)) {
    return res.status(400).json({
      error: 'Érvénytelen dateTo paraméter formátum (YYYY-MM-DD szükséges).',
    });
  }

  let url: string;
  let cacheTtl = 's-maxage=120, stale-while-revalidate=300';

  if (competition) {
    const sanitizedComp = competition.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
    url = `https://api.football-data.org/v4/competitions/${sanitizedComp}/matches`;
    const compParams = new URLSearchParams();
    if (status) compParams.append('status', status);
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

    const data: unknown = await apiRes.json();
    res.setHeader('Cache-Control', cacheTtl);
    return res.status(apiRes.status).json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Hiba a mérkőzések lekérésekor';
    return res.status(500).json({ error: message });
  }
}
