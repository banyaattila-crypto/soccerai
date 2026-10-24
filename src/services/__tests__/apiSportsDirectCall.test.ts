import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  },
  configurable: true,
  writable: true,
});

import { fetchApiSportsMatches, fetchFixtureOdds, resolveApiSportsKey, API_SPORTS_KEY_STORAGE } from '../apiSportsClient';

const emptyOk = () =>
  ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ response: [], errors: [] }),
  }) as unknown as Response;

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('API-Sports hívás: saját kulccsal közvetlenül, kulcs nélkül a proxyn át', () => {
  it('a Beállításokban tárolt kulcs a hívás kulcsa, ha nincs explicit', () => {
    expect(resolveApiSportsKey('')).toBe('');
    store[API_SPORTS_KEY_STORAGE] = '  saját  ';
    expect(resolveApiSportsKey('')).toBe('saját');
    expect(resolveApiSportsKey('explicit')).toBe('explicit');
  });

  it('kulcs nélkül csak a szerveroldali proxyt hívja', async () => {
    const f = vi.fn().mockResolvedValue(emptyOk());
    globalThis.fetch = f;
    await fetchApiSportsMatches('', '2026-10-24', true);
    const urls = f.mock.calls.map((c) => String(c[0]));
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((u) => u.startsWith('/api/apisports'))).toBe(true);
  });

  it('saját kulccsal a meccslista és a szorzó is közvetlenül megy, a proxyt nem érinti', async () => {
    store[API_SPORTS_KEY_STORAGE] = 'saját-kulcs';
    const f = vi.fn().mockResolvedValue(emptyOk());
    globalThis.fetch = f;
    await fetchApiSportsMatches('', '2026-10-24', true);
    await fetchFixtureOdds(123, undefined, true);
    const calls = f.mock.calls;
    expect(calls.length).toBeGreaterThan(1);
    for (const [url, init] of calls) {
      expect(String(url).startsWith('https://v3.football.api-sports.io/')).toBe(true);
      expect((init as RequestInit).headers).toMatchObject({ 'x-apisports-key': 'saját-kulcs' });
    }
  });
});
