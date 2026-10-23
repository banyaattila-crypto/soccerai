import { describe, it, expect, vi, afterEach } from 'vitest';
import apisportsHandler from '../../../api/apisports';
import oddsHandler from '../../../api/oddsapi';
import sportsdbHandler from '../../../api/sportsdb';

function mockRes() {
  const out = { statusCode: 200, headers: {} as Record<string, string> };
  const res = {
    setHeader: (n: string, v: string) => {
      out.headers[n.toLowerCase()] = v;
    },
    status: (code: number) => {
      out.statusCode = code;
      return { end: () => {}, json: () => {} };
    },
  };
  return { res, out };
}

let ip = 0;
async function call(handler: typeof apisportsHandler, query: Record<string, string>) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ response: [] }) } as unknown as Response);
  globalThis.fetch = fetchMock;
  vi.stubEnv('ODDS_API_KEY', 'k');
  vi.stubEnv('API_SPORTS_KEY', 'k');
  const { res, out } = mockRes();
  await handler(
    { method: 'GET', headers: { origin: 'https://soccerai-pro.vercel.app', 'x-forwarded-for': `10.7.0.${ip++ % 250}` }, query },
    res,
  );
  return { status: out.statusCode, cache: out.headers['cache-control'], upstreamCalls: fetchMock.mock.calls.length };
}

describe('proxyk: ismeretlen paraméterrel nem lehet a gyorsítótárat kijátszani', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it.each([
    ['api/apisports.ts', apisportsHandler, { date: '2026-10-24' }],
    ['api/oddsapi.ts', oddsHandler, { sport: 'soccer_epl' }],
    ['api/sportsdb.ts', sportsdbHandler, { kind: 'next', league: '4328' }],
  ])('%s: az engedett paraméterekkel megy, extra paraméterrel 400 és nincs szolgáltatói hívás', async (_n, handler, ok) => {
    const good = await call(handler, ok);
    expect(good.status).toBe(200);
    expect(good.upstreamCalls).toBe(1);

    const bust = await call(handler, { ...ok, cb: '123' });
    expect(bust.status).toBe(400);
    expect(bust.cache).toBe('no-store');
    expect(bust.upstreamCalls).toBe(0);
  });
});
