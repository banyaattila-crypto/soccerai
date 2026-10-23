import { formatKickoffShort } from '../utils/kickoffFormat';
import React, { useState, useMemo } from 'react';
import { Match, BetSlipItem } from '../types/football';
import { Sparkles, ChevronRight, Zap, LayoutGrid, Flame, Info } from 'lucide-react';
import { TopPickCard3D } from './topPicks/TopPickCard3D';

interface TopPicksProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
  onSwitchToGrid?: () => void;
}

export const TopPicks: React.FC<TopPicksProps> = ({
  matches,
  onSelectMatch,
  onAddToBetSlip,
  betSlipItems,
  onSwitchToGrid,
}) => {
  const [oddsMode, setOddsMode] = useState<'value' | 'all' | 'safe'>('value');

  // Rendezzük az AI tippel rendelkező meccseket.
  // FONTOS: Nem a haszontalan mini-oddsokat, hanem a valós ÉRTÉKET (EV, játszhatóság, robusztusság) rangsoroljuk!
  const rankedPicks = useMemo(() => {
    const getPickScore = (m: Match) => {
      const p = m.aiPick;
      if (!p) return -999;
      const isTopBonus = p.isTopPick ? 60 : 0;

      // Szorzó játszhatósági súly (Sweet Spot: 1.55 - 2.40)
      let oddsBonus = 0;
      if (p.odds < 1.30) oddsBonus = -65; // Használhatatlan mini-odds
      else if (p.odds < 1.40) oddsBonus = -40;
      else if (p.odds < 1.50) oddsBonus = -10;
      else if (p.odds >= 1.55 && p.odds <= 2.35) oddsBonus = 40; // Ideális kvantitatív sáv!
      else if (p.odds > 2.35 && p.odds <= 2.90) oddsBonus = 25;
      else if (p.odds > 2.90) oddsBonus = 12;

      const evBonus = (p.expectedValue || 0) * 2;
      const kellyBonus = (p.quarterKellyPct || 0) * 5;
      const probBonus = (p.probability || 0) * 0.4;

      return isTopBonus + oddsBonus + evBonus + kellyBonus + probBonus;
    };

    return matches
      .filter((m) => {
        if (!m.aiPick) return false;
        const verdict = m.aiPick.robustnessVerdict || m.quantAnalysis?.robustnessVerdict;
        if (verdict === 'ELVETVE') return false;

        // Szorzó szűrés a kiválasztott mód szerint
        if (oddsMode === 'value') {
          // Érték mód: elsőbbség a játszható 1.48+ szorzóknak
          return m.aiPick.odds >= 1.48;
        }
        if (oddsMode === 'safe') {
          return m.aiPick.odds < 1.50;
        }
        return true;
      })
      .sort((a, b) => getPickScore(b) - getPickScore(a));
  }, [matches, oddsMode]);

  // Ha a 'value' szűrőre túl kevés meccs maradt volna, fallback az összesre
  const displayPicks = useMemo(() => {
    if (rankedPicks.length >= 3 || oddsMode !== 'value') return rankedPicks;
    // Ha kevés az 1.48+ tipp, kiegészítjük a legjobb elérhető tippekkel
    const remaining = matches
      .filter((m) => m.aiPick && !rankedPicks.some((rp) => rp.id === m.id))
      .sort((a, b) => (b.aiPick?.odds || 0) - (a.aiPick?.odds || 0));
    return [...rankedPicks, ...remaining];
  }, [rankedPicks, matches, oddsMode]);

  // A 3 fő kiemelt kártya
  const mainTop3 = displayPicks.slice(0, 3);
  // További erős szignálok kompakt listához (max 6 db)
  const secondaryPicks = displayPicks.slice(3, 9);

  // Döntés-központú összegzés: van-e egyáltalán fogadható, valós áron értelmezhető tipp?
  const decision = useMemo(() => {
    const realActive = displayPicks.filter(
      (m) => m.aiPick && m.aiPick.isSimulatedOdds === false && !m.aiPick.isOddsExpired
    );
    const withEdge = realActive.filter((m) => (m.aiPick?.expectedValue ?? 0) > 0);
    return { realActive: realActive.length, withEdge: withEdge.length };
  }, [displayPicks]);

  if (mainTop3.length === 0) {
    if (matches.length === 0) return null;
    return (
      <section className="py-6 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            role="status"
            className="p-5 rounded-2xl bg-mesh-card border border-slate-800 text-sm text-slate-300 space-y-1.5"
          >
            <span className="font-extrabold text-white block">Ma nincs ajánlott tipp</span>
            <p className="text-xs leading-relaxed">
              A modell egyik mérkőzésen sem talált olyan jelöltet, amely átment volna a λ-rács robusztussági
              szűrőn. A nem-ajánlás is eredmény: kényszerített tipp nincs. A Mérkőzés fülön a
              valószínűségek ettől függetlenül megtekinthetők.
            </p>
            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                className="mt-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
              >
                Összes mérkőzés megnyitása ({matches.length})
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 bg-transparent w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Szekció fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kvantitatív Érték- és λ-rács szűrőn átment prémium válogatás</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              A Nap Top 3 Kiemelt AI Tippje
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-mesh-card px-3 py-1.5 rounded-xl border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Dixon–Coles &amp; Shin De-vig Modell</span>
            </div>
            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Összes mérkőzés ({matches.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Döntés-központú állapotsor */}
        <div
          role="status"
          className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
            decision.withEdge > 0
              ? 'bg-brand-500/10 border-brand-500/40 text-brand-100'
              : decision.realActive > 0
              ? 'bg-slate-800/60 border-slate-700 text-slate-200'
              : 'bg-amber-500/10 border-amber-500/40 border-dashed text-amber-100'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            {decision.withEdge > 0 ? (
              <>
                <strong>{decision.withEdge} tippen</strong> a legjobb elérhető szorzó jobb a piaci konszenzus (Pinnacle) fair áránál (+EV). Ez
                ár-előny a bukmékerek között, nem modell-előny: a backtest szerint a modell a piacnál rosszabb előrejelző.
              </>
            ) : decision.realActive > 0 ? (
              <>
                <strong>Van valós ár ({decision.realActive} tipp), de pozitív ár-előny nincs.</strong> Ma nincs
                értékfogadási ajánlás.
              </>
            ) : (
              <>
                <strong>Egyetlen tippnek sincs valós, érvényes bukmékeri ára.</strong> Az alábbi lista a modell
                esélyeinek rangsora, nem fogadási ajánlás. Valós árat a meccs elemzési ablakában lehet lekérni.
              </>
            )}
          </p>
        </div>

        {/* Szorzó Sáv Gyorsválasztó */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setOddsMode('value')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                oddsMode === 'value'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🎯 Érték Szorzók (1.50+)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-mono font-bold">
                Ajánlott
              </span>
            </button>
            <button
              onClick={() => setOddsMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                oddsMode === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🌐 Összes Szorzó</span>
            </button>
            <button
              onClick={() => setOddsMode('safe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                oddsMode === 'safe'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🛡️ Alacsony Szorzók (&lt; 1.50)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            {oddsMode === 'value'
              ? '🎯 Kvantitatív szűrő aktív: Kizárólag a játszható, valós profitabilitású (1.50+) szorzók jelennek meg.'
              : oddsMode === 'safe'
              ? '⚠️ Figyelem: A kis szorzók (< 1.50) alacsony hozamot és aszimmetrikus kockázatot hordoznak.'
              : 'Minden AI tipp megjelenítése szorzókorlát nélkül.'}
          </p>
        </div>

        {/* Top 3 Kártya Grid 3D Interaktív Döntéssel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {mainTop3.map((match, idx) => {
            const pick = match.aiPick!;
            const isAdded = betSlipItems.some(
              (item) => item.matchId === match.id && item.marketLabel === pick.marketLabel
            );

            return (
              <TopPickCard3D
                key={match.id}
                match={match}
                idx={idx}
                isAdded={isAdded}
                onAddToBetSlip={() =>
                  onAddToBetSlip({
                    matchId: match.id,
                    matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
                    marketLabel: pick.marketLabel,
                    market: pick.market,
                    odds: pick.odds,
                    probability: pick.probability,
                    quarterKellyPct: pick.quarterKellyPct,
                    isRealOdds: !pick.isSimulatedOdds && !pick.isOddsExpired,
                    isSimulatedOdds: pick.isSimulatedOdds !== false,
                    bookmakerName: pick.bookmakerName || match.realOdds?.bestOdds.home?.bookmaker,
                    oddsExpiresAt: pick.oddsExpiresAt,
                    isExpired: pick.isOddsExpired,
                    matchStatus: match.status,
                    kickoffDate: match.kickoffDate,
                    kickoffTime: match.kickoffTime,
                  })
                }
                onSelectMatch={() => onSelectMatch(match)}
              />
            );
          })}
        </div>

        {/* További Erős Napi Szignálok */}
        {secondaryPicks.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-mesh-card border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-extrabold text-white">
                  További Magas Valószínűségű Szignálok Ma (60%+)
                </h3>
              </div>
              {onSwitchToGrid && (
                <button
                  onClick={onSwitchToGrid}
                  className="btn-link text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Összes mérkőzés</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {secondaryPicks.map((m) => {
                const p = m.aiPick!;
                const isAdded = betSlipItems.some(
                  (item) => item.matchId === m.id && item.marketLabel === p.marketLabel
                );

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className="p-3 rounded-xl bg-mesh-dark hover:border-slate-700/80 border border-slate-800/90 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{m.leagueFlag}</span>
                        <span className="truncate">{m.leagueName}</span>
                        <span>&bull;</span>
                        <span className="text-brand-400 font-mono">{formatKickoffShort(m)}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-brand-200">
                        {m.homeTeam.name} – {m.awayTeam.name}
                      </div>
                      <div className="text-[11px] font-semibold text-brand-400 truncate">
                        {p.marketLabel} ({p.probability}%)
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isSim = p.isSimulatedOdds !== false;
                        const isExp = p.isOddsExpired ?? false;
                        onAddToBetSlip({
                          matchId: m.id,
                          matchTitle: `${m.homeTeam.name} - ${m.awayTeam.name}`,
                          marketLabel: p.marketLabel,
                          market: p.market,
                          odds: p.odds,
                          probability: p.probability,
                          quarterKellyPct: p.quarterKellyPct,
                          isRealOdds: !isSim && !isExp,
                          isSimulatedOdds: isSim,
                          bookmakerName: p.bookmakerName || m.realOdds?.bestOdds.home?.bookmaker,
                          oddsExpiresAt: p.oddsExpiresAt,
                          isExpired: isExp,
                          matchStatus: m.status,
                          kickoffDate: m.kickoffDate,
                          kickoffTime: m.kickoffTime,
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                          : 'bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-200 border-slate-700'
                      }`}
                      title="Szelvényhez adás"
                    >
                      @{p.odds.toFixed(2)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
