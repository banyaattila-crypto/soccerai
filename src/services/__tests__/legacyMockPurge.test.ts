import { describe, it, expect, beforeEach } from 'vitest';
import { purgeLegacyMockData } from '../legacyMockPurge';
import { STORAGE_KEY_AUDIT_LOG } from '../predictionAuditService';

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
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  },
  configurable: true,
  writable: true,
});

describe('purgeLegacyMockData', () => {
  beforeEach(() => localStorage.clear());

  it('törli a mintameccseket az archívumból, az audit-naplóból és a szelvényből, a valós rekordokat megtartja', () => {
    localStorage.setItem('soccerai_match_history_archive_v1', JSON.stringify([{ id: 'm-yest-1' }, { id: 'm-today-ucl-1' }, { id: '123456' }]));
    localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify([{ matchId: 'm-today-3' }, { matchId: 'as-998' }]));
    localStorage.setItem('soccerai_betslip_draft', JSON.stringify([{ matchId: 'm-tom-1' }]));
    localStorage.setItem('focitipp_datasource', 'builtin');
    purgeLegacyMockData();
    expect(JSON.parse(localStorage.getItem('soccerai_match_history_archive_v1')!)).toEqual([{ id: '123456' }]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT_LOG)!)).toEqual([{ matchId: 'as-998' }]);
    expect(JSON.parse(localStorage.getItem('soccerai_betslip_draft')!)).toEqual([]);
    expect(localStorage.getItem('focitipp_datasource')).toBe('api');
  });

  it('egyszer fut: a jelző után nem nyúl a tárhoz', () => {
    purgeLegacyMockData();
    localStorage.setItem('soccerai_match_history_archive_v1', JSON.stringify([{ id: 'm-yest-1' }]));
    purgeLegacyMockData();
    expect(JSON.parse(localStorage.getItem('soccerai_match_history_archive_v1')!)).toEqual([{ id: 'm-yest-1' }]);
  });

  it('sérült JSON-nál nem dob hibát', () => {
    localStorage.setItem('soccerai_match_history_archive_v1', '{nem json');
    expect(() => purgeLegacyMockData()).not.toThrow();
  });
});
