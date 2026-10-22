import { describe, it, expect } from 'vitest';
import { isLiveStale, isMatchLive, markStaleLive, MAX_LIVE_MINUTES } from '../matchStatus';
import type { Match } from '../../types/football';

const KICKOFF = '2026-10-22T19:00:00Z';
const kickoffMs = new Date(KICKOFF).getTime();
const min = (n: number) => kickoffMs + n * 60 * 1000;

const live = (over?: Partial<Match>): Match =>
  ({
    id: 'm1',
    status: 'LIVE',
    utcDate: KICKOFF,
    kickoffDate: '2026-10-22',
    kickoffTime: '21:00',
    homeScore: 1,
    awayScore: 0,
    ...over,
  }) as unknown as Match;

describe('isLiveStale', () => {
  it('a kezdéstől számított határig élő, utána elavult', () => {
    expect(isLiveStale(live(), min(68))).toBe(false);
    expect(isLiveStale(live(), min(MAX_LIVE_MINUTES))).toBe(false);
    expect(isLiveStale(live(), min(MAX_LIVE_MINUTES + 1))).toBe(true);
  });

  it('csak az LIVE státuszú meccs lehet elavult; ismeretlen kezdésnél nem az', () => {
    expect(isLiveStale(live({ status: 'FINISHED' }), min(400))).toBe(false);
    expect(isLiveStale(live({ status: 'UPCOMING' }), min(400))).toBe(false);
    expect(isLiveStale(live({ utcDate: undefined, kickoffDate: undefined, kickoffTime: undefined }), min(400))).toBe(false);
  });

  it('utcDate hiányában a helyi dátumból és időből számol', () => {
    const m = live({ utcDate: undefined, kickoffDate: '2020-01-01', kickoffTime: '12:00' });
    expect(isLiveStale(m, new Date('2020-01-01T12:00:00').getTime() + 200 * 60 * 1000)).toBe(true);
  });
});

describe('isMatchLive és markStaleLive', () => {
  it('az elavult élő meccs nem számít élőnek, a státusz érintetlen marad (az elszámoláshoz)', () => {
    const [m] = markStaleLive([live()], min(200));
    expect(m.liveStale).toBe(true);
    expect(m.status).toBe('LIVE'); // nem állítjuk át FINISHED-re: a végeredményt a forrás jelentse
    expect(isMatchLive(m)).toBe(false);
    expect(m.homeScore).toBe(1);
  });

  it('a zajló meccs élő marad', () => {
    const [m] = markStaleLive([live()], min(70));
    expect(m.liveStale).toBeFalsy();
    expect(isMatchLive(m)).toBe(true);
  });

  it('változás nélkül ugyanazt a tömböt adja vissza (nincs felesleges újrarenderelés)', () => {
    const arr = [live(), live({ id: 'm2', status: 'FINISHED' })];
    expect(markStaleLive(arr, min(70))).toBe(arr);
    const once = markStaleLive(arr, min(200));
    expect(once).not.toBe(arr);
    expect(markStaleLive(once, min(210))).toBe(once);
  });

  it('a jelző visszavonódik, ha a friss adat már nem elavult (új lekérés)', () => {
    const stale = markStaleLive([live()], min(200));
    const fresh = [{ ...stale[0], liveStale: true, utcDate: new Date(min(190)).toISOString() }];
    const back = markStaleLive(fresh, min(200)); // kezdés 10 perce: nem elavult
    expect(back[0].liveStale).toBe(false);
  });
});
