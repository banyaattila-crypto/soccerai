export default async function handler(req: any, res: any) {
  // CORS engedélyezése
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-apisports-key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token =
    req.headers['x-apisports-key'] ||
    process.env.API_SPORTS_KEY ||
    'b088263aae59a54a7f9a597f1ce83644';

  const { date } = req.query || {};
  const targetDate = date || new Date().toISOString().split('T')[0];

  const url = `https://v3.football.api-sports.io/fixtures?date=${targetDate}`;

  try {
    const apiRes = await fetch(url, {
      headers: {
        'x-apisports-key': String(token),
      },
    });

    const data = await apiRes.json();
    // 30 perces Edge gyorsítótár a napi 100 kérés védelmére
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(apiRes.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Hiba az API-Sports mérkőzések lekérésekor' });
  }
}
