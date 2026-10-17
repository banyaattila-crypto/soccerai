export default async function handler(req: any, res: any) {
  // CORS engedélyezése
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token =
    req.headers['x-auth-token'] ||
    process.env.FOOTBALL_DATA_API_KEY ||
    '0a2ff5ef40ed4113a0ca28d6b9b122d8';

  const { dateFrom, dateTo } = req.query || {};

  let url = 'https://api.football-data.org/v4/matches';
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', String(dateFrom));
  if (dateTo) params.append('dateTo', String(dateTo));
  if (params.toString()) url += `?${params.toString()}`;

  try {
    const apiRes = await fetch(url, {
      headers: {
        'X-Auth-Token': String(token),
      },
    });

    const data = await apiRes.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(apiRes.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Hiba a mérkőzések lekérésekor' });
  }
}
