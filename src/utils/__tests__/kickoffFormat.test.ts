import { describe, it, expect } from 'vitest';
import { formatKickoffShort } from '../kickoffFormat';

describe('formatKickoffShort', () => {
  it('dátumot és időt is ad', () => {
    expect(formatKickoffShort({ kickoffDate: '2026-10-22', kickoffTime: '21:00' })).toBe('10. 22. 21:00');
  });
  it('hiányzó részeknél a meglévőt adja', () => {
    expect(formatKickoffShort({ kickoffDate: '2026-10-22', kickoffTime: '' })).toBe('10. 22.');
    expect(formatKickoffShort({ kickoffDate: '', kickoffTime: '21:00' })).toBe('21:00');
    expect(formatKickoffShort({ kickoffDate: 'ismeretlen', kickoffTime: '21:00' })).toBe('21:00');
  });
});
