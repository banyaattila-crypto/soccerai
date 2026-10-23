import { describe, it, expect, beforeEach } from 'vitest';

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
  },
  configurable: true,
  writable: true,
});

import {
  recordApiSportsCall,
  recordApiSportsBodyErrors,
  getApiSportsUsage,
  resetQuotaStateForTesting,
} from '../quotaService';

beforeEach(() => resetQuotaStateForTesting());

describe('API-Sports felhasználás és fiókhiba', () => {
  it('a felfüggesztett fiókot HTTP 200 mellett is hibaként jelzi, és az üres errors törli', () => {
    const issue = recordApiSportsBodyErrors({ access: 'Your account is suspended, check on https://dashboard.api-football.com.' });
    expect(issue).toContain('fel van függesztve');
    expect(getApiSportsUsage().issue).toContain('fel van függesztve');
    expect(recordApiSportsBodyErrors([])).toBeNull();
    expect(getApiSportsUsage().issue).toBeNull();
  });

  it('a görgetett 24 órás számláló csak az elmúlt napot számolja', () => {
    const now = Date.UTC(2026, 9, 23, 12, 0, 0);
    recordApiSportsCall(200, undefined, undefined, now - 25 * 3600 * 1000);
    recordApiSportsCall(200, undefined, undefined, now - 3600 * 1000);
    recordApiSportsCall(200, undefined, undefined, now - 60 * 1000);
    expect(getApiSportsUsage(now).used24h).toBe(2);
  });

  it('a szolgáltató fejlécéből kapott hátralévő keretet pontosnak veszi', () => {
    const now = Date.UTC(2026, 9, 23, 12, 0, 0);
    recordApiSportsCall(200, '63', '100', now);
    const u = getApiSportsUsage(now + 1000);
    expect(u.remaining).toBe(63);
    expect(u.exact).toBe(true);
    expect(u.resetsAt).toBe(Date.UTC(2026, 9, 24, 0, 0, 0));
  });
});
