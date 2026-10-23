import React from 'react';
import type { Match } from '../../types/football';

/** A bajnokság-sáv felirata: "21:00 Hazai – Vendég · 21:00 ..." (kezdési idő szerint), hogy a meccsek nevei a sávon is látszódjanak. */
export function leagueMatchNameItems(matches: Pick<Match, 'kickoffTime' | 'homeTeam' | 'awayTeam'>[]): string[] {
  return [...matches]
    .sort((a, b) => (a.kickoffTime || '').localeCompare(b.kickoffTime || ''))
    .map((m) => `${m.kickoffTime ? `${m.kickoffTime} ` : ''}${m.homeTeam.name} – ${m.awayTeam.name}`);
}

interface LeagueMatchNamesProps {
  matches: Pick<Match, 'kickoffTime' | 'homeTeam' | 'awayTeam'>[];
  /** Becsukott sávon több sor fér el, kinyitva egy sorra rövidül (a lista úgyis kinyílik alatta) */
  collapsed: boolean;
}

/** A bajnokság-sáv második sora: a liga meccseinek nevei, a sáv becsukott állapotában is olvashatóan. */
export const LeagueMatchNames: React.FC<LeagueMatchNamesProps> = ({ matches, collapsed }) => {
  const items = leagueMatchNameItems(matches);
  if (items.length === 0) return null;
  return (
    <span
      className={`block text-[12px] sm:text-[13px] leading-snug text-slate-300 font-medium ${
        collapsed ? 'line-clamp-3 whitespace-normal' : 'truncate'
      }`}
      title={items.join('\n')}
    >
      {items.map((t, i) => (
        <React.Fragment key={`${t}-${i}`}>
          {i > 0 && <span className="text-slate-600"> · </span>}
          <span className="whitespace-nowrap">{t}</span>
          {i < items.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};
