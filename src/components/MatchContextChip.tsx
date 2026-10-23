import React from 'react';
import { UserX } from 'lucide-react';
import type { Match } from '../types/football';
import { resolveApiSportsFixtureId } from '../services/apiSportsClient';
import { countConfirmedAbsent, getCachedMatchContext } from '../services/matchContext';

interface MatchContextChipProps {
  match: Match;
}

/**
 * Hiányzók és felállás (API-Sports). Csak ott jelenik meg, ahol van lekért adat (protokoll-tippek, élő API-Sports fiókkal);
 * tájékoztató jelzés, a valószínűséget nem módosítja.
 */
export const MatchContextChip: React.FC<MatchContextChipProps> = ({ match }) => {
  const fixtureId = resolveApiSportsFixtureId(match);
  const ctx = fixtureId ? getCachedMatchContext(fixtureId) : null;
  if (!ctx || (!ctx.injuriesAt && !ctx.lineupsAt)) return null;

  const h = countConfirmedAbsent(ctx.homeAbsent);
  const a = countConfirmedAbsent(ctx.awayAbsent);
  const names = (list: typeof ctx.homeAbsent) =>
    list
      .slice(0, 6)
      .map((p) => `${p.name}${p.type ? ` (${/missing/i.test(p.type) ? 'kiesik' : 'kétséges'})` : ''}`)
      .join(', ') || 'nincs';
  const lineup = ctx.lineups?.home && ctx.lineups?.away ? `Felállás megerősítve: ${ctx.lineups.home} / ${ctx.lineups.away}` : null;
  const title = [
    ctx.injuriesAt ? `Hazai hiányzók: ${names(ctx.homeAbsent)}.` : null,
    ctx.injuriesAt ? `Vendég hiányzók: ${names(ctx.awayAbsent)}.` : null,
    lineup,
    'Tájékoztató adat, a valószínűséget nem módosítja.',
  ]
    .filter(Boolean)
    .join(' ');

  const heavy = h >= 3 || a >= 3;
  return (
    <span
      title={title}
      className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
        heavy ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700'
      }`}
    >
      <UserX className="w-3 h-3 shrink-0" />
      <span>
        {ctx.injuriesAt ? `Kiesők: H ${h} · V ${a}` : 'Felállás'}
        {lineup ? ' · felállás kész' : ''}
      </span>
    </span>
  );
};
