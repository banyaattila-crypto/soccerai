import React, { useState, useEffect } from 'react';
import { Match, BetSlipItem, FixtureRealOdds } from '../types/football';
import {
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  CloudSun,
  Plus,
  Check,
  Calendar,
  Clock,
  Swords,
  Grid3X3,
} from 'lucide-react';
import {
  resolveApiSportsFixtureId,
  fetchFixtureOdds,
  getCachedFixtureOdds,
  getOddsTtlStatus,
} from '../services/apiSportsClient';
import { ScoreLabH2HCard } from './ScoreLabH2HCard';
import { ScoreLabPoissonMatrix } from './ScoreLabPoissonMatrix';
import { MatchExplanationCard } from './MatchExplanationCard';
import { LiveOddsSection } from './matchDetail/LiveOddsSection';
import { MarketGapChip } from './MarketGapChip';
import { getDataQualityInfo } from '../utils/modelConfidence';
import { marketFairFromBookmakers, applyMarketProbabilities } from '../services/marketBlend';

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
  onAddToBetSlip,
  betSlipItems,
}) => {
  // 1. Hookok feltétel nélkül, mindig legfelül (React Rules of Hooks garancia)
  const [activeTab, setActiveTab] = useState<'overview' | 'h2h' | 'matrix'>('overview');
  const [realOdds, setRealOdds] = useState<FixtureRealOdds | null>(match ? match.realOdds || null : null);
  const [loadingOdds, setLoadingOdds] = useState<boolean>(false);

  useEffect(() => {
    if (!match) {
      setRealOdds(null);
      return;
    }
    setRealOdds(match.realOdds || null);

    const fId = resolveApiSportsFixtureId(match);
    if (!fId) {
      return;
    }

    // 1. Gyorsítótár ellenőrzése
    const cached = getCachedFixtureOdds(fId);
    if (cached) {
      setRealOdds(cached);
      return;
    }

    // 2. Automatikus háttérbetöltés
    let isCancelled = false;
    setLoadingOdds(true);
    fetchFixtureOdds(fId)
      .then((res) => {
        if (!isCancelled && res) {
          setRealOdds(res);
        }
      })
      .catch((err) => console.warn('Hiba odds betöltésekor:', err))
      .finally(() => {
        if (!isCancelled) setLoadingOdds(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [match?.id]);

  // 2. Korai visszatérés (Guard) KIZÁRÓLAG a hookok lefutása után!
  if (!match) return null;

  const modelP = match.modelProbabilities ?? match.probabilities;
  const isFinished = match.status === 'FINISHED';

  // Valós bukmékeri oddsok kezelése (Pinnacle & Bet365)
  const fixtureId = resolveApiSportsFixtureId(match);
  const ttlStatus = getOddsTtlStatus(realOdds);
  const isRealOddsActive = ttlStatus.isReal && !ttlStatus.isExpired;

  // Ahol van valós szorzó, az 1X2 és az O/U 2.5 valószínűség a de-vigelt piaci ár (backtest: ez a legpontosabb
  // elérhető becslés); a modell értékei mellette megmaradnak.
  const marketFair = realOdds && isRealOddsActive ? marketFairFromBookmakers(realOdds.bookmakers) : undefined;
  const marketP = marketFair ? applyMarketProbabilities(modelP, marketFair) : null;
  const p = marketP ?? modelP;

  const handleRefreshOdds = async () => {
    if (!fixtureId || loadingOdds) return;
    setLoadingOdds(true);
    try {
      const fresh = await fetchFixtureOdds(fixtureId, undefined, true);
      if (fresh) {
        setRealOdds(fresh);
      }
    } finally {
      setLoadingOdds(false);
    }
  };

  // Szelvény állapota a fő tippre
  const defaultPick = match.aiPick || {
    marketLabel: `${match.homeTeam.name} Győzelem (1)`,
    market: '1' as const,
    odds: match.odds.home,
    probability: p.homeWin,
  };

  const isAdded = betSlipItems.some(
    (item) => item.matchId === match.id && item.marketLabel === defaultPick.marketLabel
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-mesh-modal border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modál Fejléc */}
        <div className="p-4 sm:p-5 bg-mesh-header border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{match.leagueFlag}</span>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {match.leagueName} &bull; {match.leagueCountry}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{match.kickoffDate}</span>
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isFinished ? 'Lejátszva:' : 'Kezdés:'} <strong className="text-white">{match.kickoffTime}</strong></span>
                </span>
                {isFinished && (
                  <span className="font-bold text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                    LEZÁRULT
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Görgethető tartalom */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Csapatok összecsapása */}
          <div className="grid grid-cols-7 items-center bg-mesh-dark p-4 rounded-xl border border-slate-800">
            {/* Hazai */}
            <div className="col-span-3 text-center space-y-1.5">
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="w-12 h-12 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="font-extrabold text-sm text-white">{match.homeTeam.name}</div>
              <div className="text-[11px] text-slate-400">
                {match.homeTeam.rank ? `${match.homeTeam.rank}. hely` : 'Hazai'}
              </div>
              {/* Forma pöttyök */}
              <div className="flex justify-center gap-1 pt-1">
                {match.homeTeam.form?.map((f, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                      f === 'W'
                        ? 'bg-brand-500 text-white'
                        : f === 'D'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* VS vagy Eredmény */}
            <div className="col-span-1 text-center">
              {isFinished ? (
                <div className="space-y-0.5">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {match.homeScore} : {match.awayScore}
                  </div>
                  <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                    FT
                  </div>
                  {(match.kickoffDate || match.kickoffTime) && (
                    <div className="text-[10px] font-mono text-slate-400">
                      {match.kickoffDate}
                      {match.kickoffTime && (
                        <div className="text-slate-500">{match.kickoffTime}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs font-extrabold text-slate-500 bg-slate-900 py-1 px-2 rounded-md border border-slate-800 inline-block">
                  VS
                </div>
              )}
            </div>

            {/* Vendég */}
            <div className="col-span-3 text-center space-y-1.5">
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="w-12 h-12 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="font-extrabold text-sm text-white">{match.awayTeam.name}</div>
              <div className="text-[11px] text-slate-400">
                {match.awayTeam.rank ? `${match.awayTeam.rank}. hely` : 'Vendég'}
              </div>
              {/* Forma pöttyök */}
              <div className="flex justify-center gap-1 pt-1">
                {match.awayTeam.form?.map((f, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                      f === 'W'
                        ? 'bg-brand-500 text-white'
                        : f === 'D'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ScoreLab Navigációs Fülek */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Áttekintés &amp; Oddsok</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('h2h')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'h2h'
                  ? 'bg-brand-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>H2H &amp; Csapatok</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Poisson Mátrix</span>
            </button>
          </div>

          {/* Tab 2: H2H & Csapat-összehasonlítás */}
          {activeTab === 'h2h' && <ScoreLabH2HCard match={match} />}

          {/* Tab 3: Poisson Gólmátrix */}
          {activeTab === 'matrix' && <ScoreLabPoissonMatrix match={match} />}

          {/* Tab 1: Fő Áttekintés & Élő Oddsok */}
          {activeTab === 'overview' && (
            <>
              {/* Szakértői Elemzés & Meccs Magyarázat Kártya */}
              <MatchExplanationCard
                match={
                  marketP
                    ? { ...match, probabilities: marketP, modelProbabilities: modelP, probabilitySource: 'market' }
                    : match
                }
                realOddsActive={isRealOddsActive}
              />

          {/* Kvantitatív Modellezés & Szűrők (Dixon-Coles & Shin) */}
          {match.quantAnalysis && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  Kvantitatív Modellezés (Dixon-Coles &amp; Shin de-vig)
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    match.quantAnalysis.robustnessVerdict === 'ROBUSZTUS'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : match.quantAnalysis.robustnessVerdict === 'valószínű'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {match.quantAnalysis.robustnessVerdict}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Adatminőség</span>
                  <span className="text-sm font-black text-white">{match.quantAnalysis.dataQuality}-szint</span>
                  <span
                    className={`text-[10px] font-semibold block leading-tight ${getDataQualityInfo(match).toneClass}`}
                    title={getDataQualityInfo(match).description}
                  >
                    {getDataQualityInfo(match).shortLabel}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {!realOdds && match.aiPick?.isSimulatedOdds !== false ? 'Szimulált ár' : 'Valós ár'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {!realOdds && match.aiPick?.isSimulatedOdds !== false ? 'Szimulált Árrés' : 'Bukméker Vig'}
                  </span>
                  <span className="text-sm font-black text-amber-400">{match.quantAnalysis.shinMargin}%</span>
                  <span className="text-[9px] text-slate-500 block">Shin de-vig margin</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {!realOdds && match.aiPick?.isSimulatedOdds !== false ? 'Rács Stabilitás' : 'Rács Pozitív Él'}
                  </span>
                  <span className="text-sm font-black text-emerald-400">{match.quantAnalysis.posPct}%</span>
                  <span className="text-[9px] text-slate-500 block">λ-rács szűrő</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Negyed-Kelly Tét</span>
                  <span className="text-sm font-black text-amber-300">
                    {isRealOddsActive && match.quantAnalysis.quarterKellyPct > 0
                      ? `${match.quantAnalysis.quarterKellyPct}%`
                      : '0.0%'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {isRealOddsActive
                      ? 'Max. tőkeallokáció'
                      : ttlStatus.isExpired
                      ? 'Letiltva (Lejárt odds)'
                      : 'Letiltva (Szimulált ár)'}
                  </span>
                </div>
              </div>

              {match.quantAnalysis.lambdaInversion && (
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between text-slate-300 gap-1">
                  <span>
                    <strong>λ-inverzió:</strong> Piaci gólvárakozás:{' '}
                    <strong className="text-white">
                      {match.quantAnalysis.lambdaInversion.marketLambda}
                    </strong>{' '}
                    gól/meccs
                  </span>
                  <span className="text-brand-400 font-semibold">
                    {match.quantAnalysis.lambdaInversion.verdict}
                  </span>
                </div>
              )}

              {/* Valós Dixon-Coles illesztett paraméterek panel */}
              {match.quantAnalysis.dixonColesRatings?.isEmpiricallyFitted && (
                <div className="p-3 rounded-lg bg-brand-950/20 border border-brand-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-brand-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      Dixon–Coles MLE Paraméterek ({match.quantAnalysis.dixonColesRatings.sampleSize} meccs alapján)
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      γ={match.quantAnalysis.dixonColesRatings.homeAdvantage} | ρ={match.quantAnalysis.dixonColesRatings.rho}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 font-medium block truncate">{match.homeTeam.name}</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-slate-500 text-[10px]">Támadás (α):</span>
                        <span className="font-bold font-mono text-brand-400">{match.quantAnalysis.dixonColesRatings.homeAttack}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Védelem (β):</span>
                        <span className="font-bold font-mono text-slate-200">{match.quantAnalysis.dixonColesRatings.homeDefense}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 font-medium block truncate">{match.awayTeam.name}</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-slate-500 text-[10px]">Támadás (α):</span>
                        <span className="font-bold font-mono text-brand-400">{match.quantAnalysis.dixonColesRatings.awayAttack}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Védelem (β):</span>
                        <span className="font-bold font-mono text-slate-200">{match.quantAnalysis.dixonColesRatings.awayDefense}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Élő Bukmékeri Oddsok (Pinnacle & Bet365) szekció */}
          <LiveOddsSection
            match={match}
            realOdds={realOdds}
            loadingOdds={loadingOdds}
            fixtureId={fixtureId}
            ttlStatus={ttlStatus}
            isRealOddsActive={isRealOddsActive}
            marketFair={marketFair}
            modelP={modelP}
            onRefresh={handleRefreshOdds}
          />

          {/* 1X2 Valószínűségi megoszlás grafikon */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1X2 Végeredmény Esélyek</span>
              <span className="text-[10px] text-slate-500">
                {marketP ? 'Piaci ár alapján (de-vigelt)' : 'Modell becslés'}
              </span>
            </div>
            <MarketGapChip match={match} compact />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Hazai (1)</div>
                <div className="text-base font-extrabold text-brand-400">{p.homeWin}%</div>
                {marketP && <div className="text-[10px] text-slate-400">Modell: {modelP.homeWin}%</div>}
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.home.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Döntetlen (X)</div>
                <div className="text-base font-extrabold text-slate-300">{p.draw}%</div>
                {marketP && <div className="text-[10px] text-slate-400">Modell: {modelP.draw}%</div>}
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.draw.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Vendég (2)</div>
                <div className="text-base font-extrabold text-teal-400">{p.awayWin}%</div>
                {marketP && <div className="text-[10px] text-slate-400">Modell: {modelP.awayWin}%</div>}
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.away.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Gólpiacok statisztikái */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Gólpiacok & Valószínűségek
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">BTTS (Mindkettő gól)</span>
                <span className="text-sm font-bold text-white">{p.bttsYes}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">&gt; 1.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.over15}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">&gt; 2.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.over25}%</span>
                {marketP && <span className="text-[10px] text-slate-400 block">Modell: {modelP.over25}%</span>}
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1.F &gt; 0.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.fhOver05}%</span>
              </div>
            </div>
          </div>

          {/* További meccsadatok: Helyszín, időjárás */}
          {(match.venue || match.weather) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {match.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{match.venue}</span>
                </div>
              )}
              {match.weather && (
                <div className="flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{match.weather}</span>
                </div>
              )}
            </div>
          )}
            </>
          )}

        </div>

        {/* Modál lábléc / Akció gomb */}
        <div className="p-4 bg-mesh-header border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Bezárás
          </button>

          <button
            onClick={() => {
              onAddToBetSlip({
                matchId: match.id,
                matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
                marketLabel: defaultPick.marketLabel,
                market: defaultPick.market,
                odds: defaultPick.odds,
                probability: defaultPick.probability,
                quarterKellyPct: isRealOddsActive ? match.quantAnalysis?.quarterKellyPct : 0,
                isRealOdds: isRealOddsActive,
                isSimulatedOdds: !isRealOddsActive,
                bookmakerName: ttlStatus.bookmakerName,
                oddsExpiresAt: ttlStatus.expiresAt,
                isExpired: ttlStatus.isExpired,
                matchStatus: match.status,
                kickoffDate: match.kickoffDate,
                kickoffTime: match.kickoffTime,
              });
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isAdded
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Hozzáadva a szelvényhez
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Kiemelt tipp hozzáadása a szelvényhez
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
