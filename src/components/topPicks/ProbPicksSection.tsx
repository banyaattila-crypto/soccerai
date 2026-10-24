import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Match } from '../../types/football';
import { listProbCandidates } from '../../services/probPickService';
import { PROTOCOL_PROB_V1 } from '../../services/bettingProtocol';
import { getMatchKickoffTimestamp } from '../../services/predictionAuditService';

interface ProbPicksSectionProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

function formatLeft(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins >= 60 * 24) return `${Math.floor(mins / (60 * 24))} nap ${Math.floor((mins % (60 * 24)) / 60)} ó`;
  return mins >= 60 ? `${Math.floor(mins / 60)} ó ${mins % 60} p` : `${mins} p`;
}

/**
 * Magas valószínűségű tippek (B protokoll): nagy piaci valószínűség, olyan áron, ami nem rosszabb a fair árnál.
 * Csak valós, friss szorzóval rendelkező meccsek szerepelnek. A találati arányt a mérés (Eredmények oldal) igazolja.
 */
export const ProbPicksSection: React.FC<ProbPicksSectionProps> = ({ matches, onSelectMatch }) => {
  const picks = useMemo(() => listProbCandidates(matches), [matches]);
  const cfg = PROTOCOL_PROB_V1;
  const now = Date.now();

  return (
    <section className="w-full" aria-label="Magas valószínűségű tippek">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Magas valószínűségű tippek
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              ≥ {cfg.minProbPct}% · @{cfg.minOdds.toFixed(2)}–{cfg.maxOdds.toFixed(2)} · ár ≥ fair · csak papír
            </span>
          </div>

          {picks.length === 0 ? (
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Jelenleg nincs a feltételeknek megfelelő tipp. Ehhez valós, friss szorzó kell a meccshez, legalább{' '}
              {cfg.minProbPct}% piaci valószínűség, és olyan ár, ami nem rosszabb a fair árnál. A kényszerített tipp nincs.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-800">
              {picks.map((c) => {
                const left = getMatchKickoffTimestamp(c.match) - now;
                return (
                  <li key={c.match.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMatch(c.match)}
                      className="w-full text-left py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 cursor-pointer hover:bg-slate-900/50 rounded-lg px-1"
                    >
                      <span className="min-w-0 flex-1 basis-48">
                        <span className="block text-xs font-bold text-white truncate">
                          {c.match.homeTeam.name} – {c.match.awayTeam.name}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {c.match.leagueName} · {c.marketLabel} · kezdésig {formatLeft(left)}
                        </span>
                      </span>
                      <span className="text-right tabular-nums">
                        <span className="block text-base font-black text-white">{c.probPct.toFixed(0)}%</span>
                        <span className="block text-[10px] text-slate-500">piaci esély</span>
                      </span>
                      <span className="text-right tabular-nums">
                        <span className="block text-sm font-bold text-brand-300">@{c.odds.toFixed(2)}</span>
                        <span className="block text-[10px] text-slate-500 truncate max-w-[9rem]">
                          {c.bookmaker ?? 'legjobb ár'} · fair @{c.fairOdds.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-right tabular-nums w-14">
                        <span className="block text-xs font-bold text-slate-200">
                          {c.edgePct >= 0 ? '+' : ''}
                          {c.edgePct.toFixed(1)}%
                        </span>
                        <span className="block text-[10px] text-slate-500">ár-előny</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-[10px] text-slate-600 mt-3 leading-snug">
            A nagy valószínűség az árrés miatt önmagában nem jövedelmező: a tipp csak akkor szerepel, ha a legjobb irodai ár
            nem rosszabb a fair árnál. A tényleges találati arányt és a hozamot az Eredmények oldali "B protokoll" kártya
            méri; amíg annak kapuja nem zöld, a tippek csak papíron követhetők.
          </p>
        </div>
      </div>
    </section>
  );
};
