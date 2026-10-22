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
  RefreshCw,
  Building2,
  Zap,
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
import { getDataQualityInfo } from '../utils/modelConfidence';

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
  const [activeBookieTab, setActiveBookieTab] = useState<'pinnacle' | 'bet365' | 'best'>('pinnacle');

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

  const p = match.probabilities;
  const isFinished = match.status === 'FINISHED';

  // Valós bukmékeri oddsok kezelése (Pinnacle & Bet365)
  const fixtureId = resolveApiSportsFixtureId(match);
  const ttlStatus = getOddsTtlStatus(realOdds);
  const isRealOddsActive = ttlStatus.isReal && !ttlStatus.isExpired;

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

  // Várható érték (+EV %) kalkulátor a modell valószínűsége és a bukmékeri szorzó alapján
  const calcEv = (probPct: number, odd?: number) => {
    if (!odd || probPct <= 0) return null;
    const ev = Math.round(((probPct / 100) * odd - 1) * 1000) / 10;
    return ev;
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
                  <span className="font-bold text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
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
                        ? 'bg-emerald-500 text-slate-950'
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
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
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
                        ? 'bg-emerald-500 text-slate-950'
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
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
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
              <MatchExplanationCard match={match} realOddsActive={isRealOddsActive} />

          {/* Kvantitatív Modellezés & Szűrők (Dixon-Coles & Shin) */}
          {match.quantAnalysis && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
                  <span className="text-emerald-400 font-semibold">
                    {match.quantAnalysis.lambdaInversion.verdict}
                  </span>
                </div>
              )}

              {/* Valós Dixon-Coles illesztett paraméterek panel */}
              {match.quantAnalysis.dixonColesRatings?.isEmpiricallyFitted && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
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
                        <span className="font-bold font-mono text-emerald-400">{match.quantAnalysis.dixonColesRatings.homeAttack}</span>
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
                        <span className="font-bold font-mono text-emerald-400">{match.quantAnalysis.dixonColesRatings.awayAttack}</span>
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F1C36] via-[#0A1224] to-[#080D1A] border border-blue-500/30 space-y-3.5 shadow-lg">
            {/* Fejléc */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Élő Bukmékeri Oddsok &amp; Valós Piaci Élek
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ÉLŐ PIAC
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pinnacle (éles záró árak) &bull; Bet365 (fővonal)
                  </div>
                </div>
              </div>

              {/* Jobb oldali gomb / frissítés státusz */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {realOdds?.updatedAt && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Frissítve: {realOdds.updatedAt}
                  </span>
                )}
                {ttlStatus.isReal && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      ttlStatus.isExpired
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {ttlStatus.isExpired ? '🔴 Lejárt odds (60p TTL)' : `⏳ ${ttlStatus.remainingMinutes}p hátra`}
                  </span>
                )}
                {fixtureId ? (
                  <button
                    onClick={handleRefreshOdds}
                    disabled={loadingOdds}
                    title="Valós oddsok frissítése"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOdds ? 'animate-spin text-amber-400' : 'text-blue-400'}`} />
                    <span className="text-[11px]">{loadingOdds ? 'Betöltés...' : 'Frissítés'}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">
                    Modell fair oddsok
                  </span>
                )}
              </div>
            </div>

            {/* Tartalom */}
            {loadingOdds && !realOdds ? (
              <div className="p-4 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                <div className="text-xs text-slate-400 font-medium">
                  Élő Pinnacle és Bet365 oddsok lekérése...
                </div>
              </div>
            ) : realOdds ? (
              <div className="space-y-3">
                {/* Fülválasztó (Pinnacle / Bet365 / Legjobb) */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                  {realOdds.pinnacle && (
                    <button
                      onClick={() => setActiveBookieTab('pinnacle')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        activeBookieTab === 'pinnacle'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Pinnacle</span>
                      {realOdds.pinnacle.margin !== undefined && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-emerald-300 font-mono">
                          {realOdds.pinnacle.margin}% vig
                        </span>
                      )}
                    </button>
                  )}

                  {realOdds.bet365 && (
                    <button
                      onClick={() => setActiveBookieTab('bet365')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        activeBookieTab === 'bet365'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Bet365</span>
                      {realOdds.bet365.margin !== undefined && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                          {realOdds.bet365.margin}% vig
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setActiveBookieTab('best')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                      activeBookieTab === 'best'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Legjobb Piac</span>
                  </button>
                </div>

                {/* Táblázatos piac összehasonlító */}
                {(() => {
                  const currentBookie =
                    activeBookieTab === 'pinnacle'
                      ? realOdds.pinnacle
                      : activeBookieTab === 'bet365'
                      ? realOdds.bet365
                      : undefined;

                  const isBest = activeBookieTab === 'best';

                  // Szorzók kinyerése
                  const hOdd = isBest ? realOdds.bestOdds.home?.odd : currentBookie?.home;
                  const hSource = isBest ? realOdds.bestOdds.home?.bookmaker : currentBookie?.name;
                  const dOdd = isBest ? realOdds.bestOdds.draw?.odd : currentBookie?.draw;
                  const dSource = isBest ? realOdds.bestOdds.draw?.bookmaker : currentBookie?.name;
                  const aOdd = isBest ? realOdds.bestOdds.away?.odd : currentBookie?.away;
                  const aSource = isBest ? realOdds.bestOdds.away?.bookmaker : currentBookie?.name;

                  const o25Odd = isBest ? realOdds.bestOdds.over25?.odd : currentBookie?.over25;
                  const o25Source = isBest ? realOdds.bestOdds.over25?.bookmaker : currentBookie?.name;
                  const u25Odd = isBest ? realOdds.bestOdds.under25?.odd : currentBookie?.under25;
                  const u25Source = isBest ? realOdds.bestOdds.under25?.bookmaker : currentBookie?.name;

                  const bttsOdd = isBest ? realOdds.bestOdds.bttsYes?.odd : currentBookie?.bttsYes;
                  const bttsSource = isBest ? realOdds.bestOdds.bttsYes?.bookmaker : currentBookie?.name;

                  // EV kalkulációk
                  const hEv = calcEv(p.homeWin, hOdd);
                  const dEv = calcEv(p.draw, dOdd);
                  const aEv = calcEv(p.awayWin, aOdd);
                  const o25Ev = calcEv(p.over25, o25Odd);
                  const u25Ev = calcEv(Math.max(1, 100 - p.over25), u25Odd);
                  const bttsEv = calcEv(p.bttsYes, bttsOdd);

                  const fairHome = (100 / Math.max(1, p.homeWin)).toFixed(2);
                  const fairDraw = (100 / Math.max(1, p.draw)).toFixed(2);
                  const fairAway = (100 / Math.max(1, p.awayWin)).toFixed(2);
                  const fairOver25 = (100 / Math.max(1, p.over25)).toFixed(2);
                  const fairUnder25 = (100 / Math.max(1, 100 - p.over25)).toFixed(2);
                  const fairBtts = (100 / Math.max(1, p.bttsYes)).toFixed(2);

                  const renderRow = (
                    label: string,
                    fairStr: string,
                    odd?: number,
                    ev?: number | null,
                    source?: string
                  ) => {
                    const hasOdd = odd !== undefined && odd > 1;
                    const isPositive = isRealOddsActive && ev !== undefined && ev !== null && ev > 0;

                    return (
                      <div className="grid grid-cols-12 items-center py-1.5 px-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-950/80 transition-colors border border-slate-800/60 text-xs">
                        <div className="col-span-4 font-semibold text-white flex flex-col">
                          <span>{label}</span>
                          {source && isBest && (
                            <span className="text-[9px] text-slate-500 truncate">{source}</span>
                          )}
                        </div>

                        <div className="col-span-3 text-center text-slate-400 font-mono text-[11px]">
                          Fair: <strong className="text-slate-200">{fairStr}</strong>
                        </div>

                        <div className="col-span-3 text-center">
                          {hasOdd ? (
                            <span
                              className={`font-extrabold font-mono px-2 py-0.5 rounded border ${
                                !isRealOddsActive && ttlStatus.isExpired
                                  ? 'text-red-300 bg-red-950/30 border-red-500/20 line-through'
                                  : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                              }`}
                            >
                              {odd.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">-</span>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          {hasOdd && isRealOddsActive && ev !== null && ev !== undefined ? (
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                isPositive
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700/60'
                              }`}
                            >
                              {ev > 0 ? `+${ev}%` : `${ev}%`}
                            </span>
                          ) : hasOdd && !isRealOddsActive ? (
                            <span className="text-slate-500 text-[10px] italic">
                              {ttlStatus.isExpired ? 'Lejárt' : 'Letiltva'}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 px-2.5 pb-0.5">
                        <div className="col-span-4">Piac / Kimenetel</div>
                        <div className="col-span-3 text-center">Modell Fair</div>
                        <div className="col-span-3 text-center">Bukméker</div>
                        <div className="col-span-2 text-right">Érték (+EV)</div>
                      </div>

                      {renderRow(`${match.homeTeam.shortName || match.homeTeam.name} (1)`, fairHome, hOdd, hEv, hSource)}
                      {renderRow('Döntetlen (X)', fairDraw, dOdd, dEv, dSource)}
                      {renderRow(`${match.awayTeam.shortName || match.awayTeam.name} (2)`, fairAway, aOdd, aEv, aSource)}
                      {renderRow('2.5 Gól Felett', fairOver25, o25Odd, o25Ev, o25Source)}
                      {renderRow('2.5 Gól Alatt', fairUnder25, u25Odd, u25Ev, u25Source)}
                      {bttsOdd && renderRow('Mindkét Csapat Lő (BTTS)', fairBtts, bttsOdd, bttsEv, bttsSource)}
                    </div>
                  );
                })()}

                {/* Bukméker információ & árrés összegzés */}
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 gap-1">
                  <span>
                    Elérhető bukmékerek:{' '}
                    <strong className="text-slate-200">
                      {realOdds.bookmakers.map((b) => b.name).slice(0, 4).join(', ')}
                      {realOdds.bookmakers.length > 4 ? ` (+${realOdds.bookmakers.length - 4})` : ''}
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Zöld kiemelés: Pozitív Várható Érték (+EV)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
                <div>A bukmékerek még nem nyitották meg a hivatalos élő piacot ehhez a mérkőzéshez.</div>
                <div className="text-[11px] text-slate-500">
                  A fenti kvantitatív Dixon–Coles és Shin de-vig modell fair szorzói érvényesek.
                </div>
              </div>
            )}
          </div>

          {/* 1X2 Valószínűségi megoszlás grafikon */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1X2 Végeredmény Esélyek</span>
              <span className="text-[10px] text-slate-500">Modell becslés</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Hazai (1)</div>
                <div className="text-base font-extrabold text-emerald-400">{p.homeWin}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.home.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Döntetlen (X)</div>
                <div className="text-base font-extrabold text-slate-300">{p.draw}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.draw.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Vendég (2)</div>
                <div className="text-base font-extrabold text-teal-400">{p.awayWin}%</div>
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
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
