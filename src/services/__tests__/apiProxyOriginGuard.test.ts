import { describe, it, expect, vi, afterEach } from 'vitest';
import matchesHandler from '../../../api/matches';
import apisportsHandler from '../../../api/apisports';

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

let ipCounter = 0;
async function call(handler: typeof matchesHandler, headers: Record<string, string>) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ matches: [], response: [] }),
  } as unknown as Response);
  const { res, out } = mockRes();
  await handler(
    {
      method: 'GET',
      headers: { 'x-forwarded-for': `10.9.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`, 'x-apisports-key': 'k', 'x-auth-token': 'k', ...headers },
      query: { date: '2026-10-22' },
    },
    res,
  );
  return out.statusCode;
}

describe.each([
  ['api/matches.ts', matchesHandler],
  ['api/apisports.ts', apisportsHandler],
])('%s: kérés-forrás védelem', (_name, handler) => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('engedett Origin átmegy, idegen Origin 403', async () => {
    expect(await call(handler, { origin: 'https://soccerai-pro.vercel.app' })).toBe(200);
    expect(await call(handler, { origin: 'https://evil.example.com' })).toBe(403);
  });

  it('Origin nélkül csak same-origin / same-site / none Sec-Fetch-Site vagy engedett Referer megy át', async () => {
    expect(await call(handler, { 'sec-fetch-site': 'same-origin' })).toBe(200);
    expect(await call(handler, { 'sec-fetch-site': 'none' })).toBe(200);
    expect(await call(handler, { 'sec-fetch-site': 'cross-site' })).toBe(403);
    expect(await call(handler, { referer: 'https://soccerai-pro.vercel.app/?tab=picks' })).toBe(200);
    expect(await call(handler, { referer: 'https://evil.example.com/page' })).toBe(403);
  });

  it('fejléc nélküli (curl-szerű) kérés 403', async () => {
    expect(await call(handler, {})).toBe(403);
  });
});
