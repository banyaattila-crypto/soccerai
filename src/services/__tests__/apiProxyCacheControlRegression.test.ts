import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import matchesHandler from '../../../api/matches';
import apisportsHandler from '../../../api/apisports';

interface MockResponse {
  headers: Record<string, string>;
  statusCode: number;
  body: unknown;
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    end: () => void;
    json: (body: unknown) => void;
  };
}

function createMockResponse(): MockResponse {
  const headers: Record<string, string> = {};
  const mock: MockResponse = {
    headers,
    statusCode: 200,
    body: null,
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    status: (code: number) => {
      mock.statusCode = code;
      return {
        end: () => {},
        json: (body: unknown) => {
          mock.body = body;
        },
      };
    },
  };
  return mock;
}

describe('Vercel Edge API Proxy Cache-Control Regression Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('api/matches.ts (Football-Data proxy)', () => {
    it('sets public s-maxage Cache-Control on successful 200 OK responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ matches: [{ id: 101 }] }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-auth-token': 'dummy-fd-token',
          'x-forwarded-for': '10.0.0.1',
        },
        query: {
          dateFrom: '2026-10-21',
          dateTo: '2026-10-21',
        },
      };

      const res = createMockResponse();
      await matchesHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toBeDefined();
      expect(res.headers['cache-control']).toContain('s-maxage=');
      expect(res.headers['cache-control']).not.toContain('no-store');
    });

    it('sets Cache-Control: no-store on upstream 429 Too Many Requests', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'API rate limit exceeded. Please wait.' }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-auth-token': 'dummy-fd-token',
          'x-forwarded-for': '10.0.0.2',
        },
        query: {
          dateFrom: '2026-10-21',
          dateTo: '2026-10-21',
        },
      };

      const res = createMockResponse();
      await matchesHandler(req, res);

      expect(res.statusCode).toBe(429);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('sets Cache-Control: no-store on upstream 500 / 503 server errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Service Unavailable' }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-auth-token': 'dummy-fd-token',
          'x-forwarded-for': '10.0.0.3',
        },
        query: {
          competition: 'PL',
        },
      };

      const res = createMockResponse();
      await matchesHandler(req, res);

      expect(res.statusCode).toBe(503);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('sets Cache-Control: no-store on network or unexpected exceptions', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-auth-token': 'dummy-fd-token',
          'x-forwarded-for': '10.0.0.4',
        },
        query: {
          dateFrom: '2026-10-21',
          dateTo: '2026-10-21',
        },
      };

      const res = createMockResponse();
      await matchesHandler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('api/apisports.ts (API-Sports proxy)', () => {
    it('sets public s-maxage Cache-Control on successful 200 OK responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: [{ fixture: { id: 202 } }] }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-apisports-key': 'dummy-apisports-key',
          'x-forwarded-for': '10.0.0.5',
        },
        query: {
          fixture: '202',
          endpoint: 'odds',
        },
      };

      const res = createMockResponse();
      await apisportsHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toBeDefined();
      expect(res.headers['cache-control']).toContain('s-maxage=1800');
      expect(res.headers['cache-control']).not.toContain('no-store');
    });

    it('élő mérkőzést tartalmazó menetrendnél rövid (7 perces) s-maxage-et ad, lefújtnál 30 percet', async () => {
      const call = async (statusShort: string) => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ response: [{ fixture: { id: 1, status: { short: statusShort } } }] }),
        } as unknown as Response);
        const req = {
          method: 'GET',
          headers: {
            origin: 'https://soccerai-pro.vercel.app',
            'x-apisports-key': 'dummy-apisports-key',
            'x-forwarded-for': '10.0.1.' + Math.floor(Math.random() * 200),
          },
          query: { date: '2026-10-22' },
        };
        const res = createMockResponse();
        await apisportsHandler(req, res);
        return res.headers['cache-control'] as string;
      };
      expect(await call('2H')).toContain('s-maxage=420');
      expect(await call('HT')).toContain('s-maxage=420');
      expect(await call('FT')).toContain('s-maxage=1800');
      expect(await call('NS')).toContain('s-maxage=1800');
    });

    it('sets Cache-Control: no-store on upstream 429 Too Many Requests', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ errors: { rateLimit: 'Too many requests' } }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-apisports-key': 'dummy-apisports-key',
          'x-forwarded-for': '10.0.0.6',
        },
        query: {
          fixture: '202',
          endpoint: 'odds',
        },
      };

      const res = createMockResponse();
      await apisportsHandler(req, res);

      expect(res.statusCode).toBe(429);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('sets Cache-Control: no-store on upstream 500 / 502 server errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad Gateway' }),
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-apisports-key': 'dummy-apisports-key',
          'x-forwarded-for': '10.0.0.7',
        },
        query: {
          date: '2026-10-21',
        },
      };

      const res = createMockResponse();
      await apisportsHandler(req, res);

      expect(res.statusCode).toBe(502);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('sets Cache-Control: no-store when upstream returns non-JSON error body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      } as unknown as Response);

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-apisports-key': 'dummy-apisports-key',
          'x-forwarded-for': '10.0.0.8',
        },
        query: {
          fixture: '202',
          endpoint: 'odds',
        },
      };

      const res = createMockResponse();
      await apisportsHandler(req, res);

      expect(res.statusCode).toBe(502);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('sets Cache-Control: no-store on network exceptions', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('DNS resolution error'));

      const req = {
        method: 'GET',
        headers: {
          origin: 'https://soccerai-pro.vercel.app',
          'x-apisports-key': 'dummy-apisports-key',
          'x-forwarded-for': '10.0.0.9',
        },
        query: {
          fixture: '202',
          endpoint: 'odds',
        },
      };

      const res = createMockResponse();
      await apisportsHandler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });
});
