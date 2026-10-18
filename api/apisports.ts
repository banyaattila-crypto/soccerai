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
const FIXTURE_ID_REGEX = /^\d{1,10}$/;

// Egyszerű memóriabeli rate limit (max 25 kérés / perc / IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 25;

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
    'Accept, Content-Type, x-apisports-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Csak GET kérések engedélyezettek.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ||
    'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Túl sok kérés. Kérlek várj egy percet az újrapróbálkozás előtt.',
    });
  }

  const headerToken = Array.isArray(req.headers['x-apisports-key'])
    ? req.headers['x-apisports-key'][0]
    : req.headers['x-apisports-key'];
  const token = headerToken?.trim() || process.env.API_SPORTS_KEY;

  if (!token) {
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

  if (endpoint && endpoint !== 'odds' && endpoint !== 'fixtures') {
    return res.status(400).json({
      error: 'Érvénytelen endpoint paraméter (csak "odds" vagy "fixtures" támogatott).',
    });
  }

  let url: string;
  if (endpoint === 'odds' || fixture) {
    if (!fixture || !FIXTURE_ID_REGEX.test(fixture)) {
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

    const data: unknown = await apiRes.json();
    // 30 perces Edge gyorsítótár a napi 100 kérés védelmére
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(apiRes.status).json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Hiba az API-Sports mérkőzések lekérésekor';
    return res.status(500).json({ error: message });
  }
}
