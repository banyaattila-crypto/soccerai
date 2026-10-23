import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LeagueMatchNames, leagueMatchNameItems } from '../grid/LeagueMatchNames';

const m = (time: string, home: string, away: string) => ({
  kickoffTime: time,
  homeTeam: { name: home },
  awayTeam: { name: away },
});

describe('bajnokság-sáv meccsnevei', () => {
  it('kezdési idő szerint rendezett "idő Hazai – Vendég" tételeket ad', () => {
    const items = leagueMatchNameItems([
      m('21:00', 'Alavés', 'Málaga'),
      m('18:30', 'Ipswich Town', 'Nottingham'),
    ] as never);
    expect(items).toEqual(['18:30 Ipswich Town – Nottingham', '21:00 Alavés – Málaga']);
  });

  it('a sávon becsukva is olvashatók a nevek (több sorban), kinyitva egy sorra rövidülnek', () => {
    const matches = [m('21:00', 'Alavés', 'Málaga'), m('20:45', 'Torino', 'Monza')] as never;
    const collapsed = renderToString(<LeagueMatchNames matches={matches} collapsed />);
    expect(collapsed).toContain('20:45 Torino – Monza');
    expect(collapsed).toContain('21:00 Alavés – Málaga');
    expect(collapsed).toContain('line-clamp-3');
    const open = renderToString(<LeagueMatchNames matches={matches} collapsed={false} />);
    expect(open).toContain('truncate');
    expect(open).not.toContain('line-clamp-3');
  });

  it('meccs nélkül nem renderel semmit', () => {
    expect(renderToString(<LeagueMatchNames matches={[] as never} collapsed />)).toBe('');
  });
});
