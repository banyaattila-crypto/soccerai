import React, { useState, useMemo } from 'react';
import { Match, BetSlipItem } from '../types/football';
import { Sparkles, Plus, Check, ChevronRight, Zap, LayoutGrid, Flame, ShieldCheck } from 'lucide-react';

interface TopPicksProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
  onSwitchToGrid?: () => void;
}

interface TopPickCard3DProps {
  match: Match;
  idx: number;
  isAdded: boolean;
  onAddToBetSlip: () => void;
  onSelectMatch: () => void;
}

const TopPickCard3D: React.FC<TopPickCard3DProps> = ({
  match,
  idx,
  isAdded,
  onAddToBetSlip,
  onSelectMatch,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const pick = match.aiPick!;
  const impliedProb = Math.round((1 / pick.odds) * 100);
  const edge = pick.probability - impliedProb;
  const verdict = pick.robustnessVerdict || match.quantAnalysis?.robustnessVerdict || 'ROBUSZTUS';
  const isSimulated = pick.isSimulatedOdds !== false;
  const isExpired = pick.isOddsExpired ?? false;
  const bookmakerName = pick.bookmakerName || match.realOdds?.bestOdds.home?.bookmaker;
  const ttlMinutes = pick.ttlMinutes ?? match.realOdds?.ttlMinutes;
  const isRealActive = !isSimulated && !isExpired;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12; // -6deg to +6deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl transition-all duration-300"
      style={{ perspective: '1000px' }}
    >
      <div
        className="group relative flex flex-col justify-between rounded-2xl bg-mesh-card border border-slate-800 hover:border-emerald-500/50 shadow-xl overflow-hidden h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: tilt.active
            ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
          transition: tilt.active ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
      >
        {/* 3D Fénytükröződési sáv egérmozgásra */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-emerald-400/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ transform: 'translateZ(10px)' }}
        />

        <div className="p-4 sm:p-5 pb-3">
          {/* Fejléc címke & Ligainfó */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 truncate">
              <span>{match.leagueFlag}</span>
              <span className="truncate">{match.leagueName}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400 font-bold">{match.kickoffTime}</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {isRealActive && bookmakerName ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-blue-500/15 text-blue-300 border-blue-500/30 flex items-center gap-1">
                  <span>🏢 {bookmakerName}</span>
                  {ttlMinutes !== undefined && (
                    <span className="text-[9px] text-blue-400 font-mono">⏳ {ttlMinutes}p</span>
                  )}
                </span>
              ) : isExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-red-500/15 text-red-300 border-red-500/30">
                  🔴 Lejárt
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-slate-800/80 text-slate-400 border-slate-700">
                  🧪 Szimulált
                </span>
              )}
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                  idx === 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                #{idx + 1} TOP TIPP
              </span>
            </div>
          </div>

          {/* Csapatok logókkal (3D Mélység kiemelés) */}
          <div
            className="space-y-1.5 py-1.5 transition-transform"
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={match.homeTeam.logo}
                  alt={match.homeTeam.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors truncate">
                  {match.homeTeam.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                xG {match.homeTeam.xgAvg}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-200 transition-colors truncate">
                  {match.awayTeam.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                xG {match.awayTeam.xgAvg}
              </span>
            </div>
          </div>

          {/* Fő Tipp Box (3D Kiemelt mélység) */}
          <div
            className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between gap-2 shadow-inner"
            style={{ transform: 'translateZ(25px)' }}
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                MI Ajánlott Tipp
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-300 truncate block">
                {pick.marketLabel}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                {isRealActive ? '🎯 Bukméker Odds' : isExpired ? '🔴 Lejárt Odds' : '🧪 Szimulált Odds'}
              </span>
              <span
                className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${
                  isRealActive
                    ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40 shadow-sm shadow-emerald-900/30'
                    : isExpired
                    ? 'text-red-300 bg-red-950/40 border-red-500/30 line-through opacity-80'
                    : 'text-amber-300 bg-amber-950/40 border-amber-500/30'
                }`}
              >
                {pick.odds.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Valószínűség & Fair ár indikátor */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Becsült modell esély:</span>
              <span className="font-extrabold text-emerald-400">{pick.probability}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pick.probability}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Implikált esély: {impliedProb}%</span>
              <span className={isRealActive && edge > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isRealActive
                  ? (pick.expectedValue > 0
                    ? `Piaci előny (+EV): +${pick.expectedValue}%`
                    : edge > 0
                    ? `Piaci előny: +${edge}%`
                    : `Fair szorzó: @${(100 / Math.max(1, pick.probability)).toFixed(2)}`)
                  : isExpired
                  ? 'Lejárt ár (Value letiltva)'
                  : 'Szimulált ár (Value letiltva)'}
              </span>
            </div>
          </div>

          {/* Kvantitatív Robusztussági & Kelly sáv */}
          {match.quantAnalysis && (
            <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span
                className={`flex items-center gap-1 font-bold ${
                  verdict === 'ROBUSZTUS'
                    ? 'text-emerald-400'
                    : verdict === 'valószínű'
                    ? 'text-teal-300'
                    : 'text-amber-400'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {verdict}
              </span>
              <span className="text-slate-400">
                Minőség: <strong className="text-slate-200">{match.quantAnalysis.dataQuality}</strong>
              </span>
              <span className="text-slate-300 font-mono font-bold">
                {isRealActive && pick.quarterKellyPct && pick.quarterKellyPct > 0
                  ? `¼-Kelly: ${pick.quarterKellyPct}%`
                  : isExpired
                  ? 'Kelly: Letiltva (lejárt)'
                  : 'Kelly: Letiltva (szimulált)'}
              </span>
            </div>
          )}

          {/* AI Szöveges Indoklás */}
          <p className="mt-2.5 text-[11px] text-slate-300 leading-relaxed bg-mesh-dark p-2.5 rounded-lg border border-slate-800/80 line-clamp-2">
            &ldquo;{pick.reasoning}&rdquo;
          </p>
        </div>

        {/* Alsó gombsor */}
        <div className="p-3.5 pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={onAddToBetSlip}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAdded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Szelvényen
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Szelvényhez
              </>
            )}
          </button>

          <button
            onClick={onSelectMatch}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Részletes adatok"
          >
            <span>Elemzés</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

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

  if (mainTop3.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 bg-transparent w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Szekció fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kvantitatív Érték- és λ-rács szűrőn átment prémium válogatás</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              A Nap Top 3 Kiemelt AI Tippje
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-mesh-card px-3 py-1.5 rounded-xl border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dixon–Coles &amp; Shin De-vig Modell</span>
            </div>
            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Teljes Rács ({matches.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Szorzó Sáv Gyorsválasztó */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setOddsMode('value')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                oddsMode === 'value'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🎯 Érték Szorzók (1.50+)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
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
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  További Magas Valószínűségű Szignálok Ma (60%+)
                </h3>
              </div>
              {onSwitchToGrid && (
                <button
                  onClick={onSwitchToGrid}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Összes mérkőzés a Rácsban</span>
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
                        <span className="text-emerald-400 font-mono">{m.kickoffTime}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-emerald-200">
                        {m.homeTeam.name} – {m.awayTeam.name}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-400 truncate">
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
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 border-slate-700'
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
