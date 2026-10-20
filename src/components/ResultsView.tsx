import React, { useState, useMemo, useEffect } from 'react';
import { Match, PredictionAuditRecord } from '../types/football';
import {
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  Filter,
  Flame,
  Calendar,
  Clock,
  Lock,
  Download,
  Upload,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';
import { getRelativeDateStr } from '../utils/dateUtils';
import {
  getAuditLog,
  getVerifiedAuditStats,
  exportAuditLogAsJson,
  importAuditLogFromJson,
  AUDIT_BASE_STAKE,
} from '../services/predictionAuditService';
import { getArchivedFinishedMatches } from '../services/historyService';
import {
  evaluatePickWon,
  getMarketCategory,
  type MarketCategory,
} from '../services/betEvaluation';

export { evaluatePickWon, getMarketCategory, type MarketCategory };

export type StatusFilter = 'ALL' | 'WON' | 'LOST' | 'PENDING';
export type ProvenanceViewTab = 'verified' | 'unverified';

interface ResultsViewProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ matches, onSelectMatch }) => {
  const [provenanceTab, setProvenanceTab] = useState<ProvenanceViewTab>('verified');
  const [activeMarket, setActiveMarket] = useState<MarketCategory>('ALL');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'>('ALL');
  const [auditLogUpdateKey, setAuditLogUpdateKey] = useState<number>(0);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [importNotice, setImportNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => getRelativeDateStr(0), []);
  const yesterdayStr = useMemo(() => getRelativeDateStr(-1), []);

  // Reakció az audit napló frissüléseire
  useEffect(() => {
    const handler = () => setAuditLogUpdateKey((prev) => prev + 1);
    window.addEventListener('focitipp_audit_log_updated', handler);
    return () => window.removeEventListener('focitipp_audit_log_updated', handler);
  }, []);

  // 1. Audit napló betöltése a megmásíthatatlan tárolóból
  const auditRecords = useMemo(() => {
    return getAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditLogUpdateKey, matches]);

  // Hitelesített pre-match rekordok szűrése
  const verifiedRecords = useMemo(() => {
    return auditRecords.filter((r) => r.provenance === 'VERIFIED_PRE_MATCH');
  }, [auditRecords]);

  // 2. Hitelesített hivatalos statisztikák kiszámítása (KIZÁRÓLAG lezárt pre-match meccsekből!)
  const verifiedStats = useMemo(() => {
    return getVerifiedAuditStats(auditRecords, AUDIT_BASE_STAKE);
  }, [auditRecords]);

  // 3. Nem auditált meccsek (utólagos API vagy régi archívum meccsek)
  const unverifiedFinishedMatches = useMemo(() => {
    const liveFinished = matches.filter((m) => m.status === 'FINISHED');
    const archived = getArchivedFinishedMatches();
    const map = new Map<string, Match>();

    // Az auditált meccsek ID-jai, hogy ne szerepeljenek duplán
    const verifiedIds = new Set(verifiedRecords.map((r) => r.matchId));

    archived.forEach((m) => {
      if (!verifiedIds.has(m.id)) map.set(m.id, m);
    });
    liveFinished.forEach((m) => {
      if (!verifiedIds.has(m.id)) map.set(m.id, m);
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = `${a.kickoffDate}T${a.kickoffTime || '00:00'}`;
      const dateB = `${b.kickoffDate}T${b.kickoffTime || '00:00'}`;
      return dateB.localeCompare(dateA);
    });
  }, [matches, verifiedRecords]);

  // 4. Hitelesített piaci bontás
  const verifiedMarketBreakdown = useMemo(() => {
    const settled = verifiedRecords.filter((r) => r.settled && r.status !== 'VOID');
    const categories: { id: MarketCategory; label: string; icon: typeof Zap; color: string }[] = [
      { id: 'COMBINED', label: 'BTTS & 2.5 Felett', icon: Zap, color: 'text-amber-400' },
      { id: 'BTTS', label: 'Mindkét Csapat Lő', icon: Flame, color: 'text-orange-400' },
      { id: 'OVER_25', label: '2.5 Gól Felett', icon: TrendingUp, color: 'text-emerald-400' },
      { id: '1X2', label: 'Csapat Győzelmek', icon: Award, color: 'text-blue-400' },
      { id: 'UNDER_25', label: '2.5 Gól Alatt', icon: ShieldCheck, color: 'text-teal-400' },
    ];

    return categories.map((cat) => {
      const items = settled.filter((r) => {
        const m = r.pick.market;
        if (cat.id === '1X2') return ['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN'].includes(m);
        if (cat.id === 'BTTS') return ['BTTS', 'BTTS_YES'].includes(m);
        if (cat.id === 'OVER_25') return m === 'OVER_25';
        if (cat.id === 'UNDER_25') return m === 'UNDER_25';
        if (cat.id === 'COMBINED') return m === 'BTTS_AND_OVER25';
        return false;
      });

      const total = items.length;
      const won = items.filter((i) => i.status === 'WON').length;
      const winRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
      const profit = items.reduce((acc, curr) => acc + curr.profit, 0);
      const roi = total > 0 ? Math.round((profit / (total * AUDIT_BASE_STAKE)) * 1000) / 10 : 0;

      return {
        ...cat,
        total,
        won,
        winRate,
        profit,
        roi,
      };
    });
  }, [verifiedRecords]);

  // 5. Elérhető ligák az audit naplóból
  const distinctAuditLeagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; flag?: string }>();
    verifiedRecords.forEach((r) => {
      if (!map.has(r.leagueId)) {
        map.set(r.leagueId, {
          id: r.leagueId,
          name: r.leagueName,
          flag: r.leagueFlag,
        });
      }
    });
    return Array.from(map.values());
  }, [verifiedRecords]);

  // 6. Szűrt audit lista
  const filteredAuditRecords = useMemo(() => {
    return verifiedRecords.filter((r) => {
      if (periodFilter === 'TODAY' && r.kickoffDate !== todayStr) return false;
      if (periodFilter === 'YESTERDAY' && r.kickoffDate !== yesterdayStr) return false;
      if (periodFilter === 'WEEK') {
        const d = new Date(r.kickoffDate).getTime();
        const now = Date.now();
        if (Number.isNaN(d) || now - d > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (activeMarket !== 'ALL') {
        const cat = getMarketCategory(r.pick.market, r.pick.marketLabel);
        if (cat !== activeMarket) return false;
      }
      if (activeStatus === 'WON' && r.status !== 'WON') return false;
      if (activeStatus === 'LOST' && r.status !== 'LOST') return false;
      if (activeStatus === 'PENDING' && r.settled) return false;
      if (selectedLeague !== 'ALL' && r.leagueId !== selectedLeague) return false;
      return true;
    });
  }, [verifiedRecords, periodFilter, activeMarket, activeStatus, selectedLeague, todayStr, yesterdayStr]);

  // JSON export letöltése
  const handleExportJson = () => {
    const jsonStr = exportAuditLogAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soccerai-audit-log-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON másolása vágólapra
  const handleCopyJson = () => {
    const jsonStr = exportAuditLogAsJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // JSON importálása fájlból
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importAuditLogFromJson(content);
      if (res.success) {
        setImportNotice({
          text: `Audit napló sikeresen importálva: ${res.importedCount} rekord feldolgozva (${res.verifiedCount} hitelesített pre-match rekord).`,
          error: false,
        });
        setAuditLogUpdateKey((prev) => prev + 1);
      } else {
        setImportNotice({
          text: `Import sikertelen: ${res.errors.join('; ') || 'Érvénytelen audit napló formátum.'}`,
          error: true,
        });
      }
      setTimeout(() => setImportNotice(null), 6000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Fő fejléc és Provenance Módváltó */}
        <div className="p-6 rounded-2xl bg-mesh-card border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pre-Match Predikciónapló &amp; Hitelesített Eredmények</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Auditált Eredmények &amp; Ellenőrizhető Megtérülés
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Minden előrejelzés szigorúan a kezdőrúgás <strong>előtt</strong> rögzítésre kerül a megmásíthatatlan naplóba. Utólagos tippbeillesztés nem lehetséges.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportJson}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Audit napló importálása JSON fájlból kriptográfiai ellenőrzéssel"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Audit Import</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Audit napló másolása JSON formátumban"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedJson ? 'Másolva!' : 'Audit JSON'}</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Audit napló letöltése"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Napló Letöltése</span>
              </button>
            </div>
          </div>

          {/* Import visszajelzés banner */}
          {importNotice && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fade-in ${
                importNotice.error
                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>{importNotice.text}</span>
              <button
                onClick={() => setImportNotice(null)}
                className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* Fülválasztó: Hitelesített Pre-Match vs Nem Auditált Előzmények */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setProvenanceTab('verified')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                provenanceTab === 'verified'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Hitelesített Pre-Match Napló ({verifiedRecords.length})</span>
            </button>
            <button
              onClick={() => setProvenanceTab('unverified')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                provenanceTab === 'unverified'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Nem auditált külső archívum ({unverifiedFinishedMatches.length})</span>
            </button>
          </div>

          {/* HITELTESÍTETT NÉZET: FŐ KPI MUTATÓK */}
          {provenanceTab === 'verified' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
              {/* Találati Arány */}
              <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Hitelesített Találati Arány
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {verifiedStats.settledCount > 0 ? `${verifiedStats.winRate}%` : '—'}
                  </span>
                  {verifiedStats.settledCount > 0 && (
                    <span className="text-xs text-slate-400 font-mono">
                      ({verifiedStats.wonCount}/{verifiedStats.settledCount})
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {verifiedStats.pendingCount > 0
                    ? `${verifiedStats.pendingCount} mérkőzés kezdésre/lefújásra vár`
                    : 'Kizárólag lezárt pre-match tippekből'}
                </span>
              </div>

              {/* Hitelesített ROI */}
              <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Hitelesített ROI %
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      verifiedStats.settledCount === 0
                        ? 'text-slate-500'
                        : verifiedStats.roi >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {verifiedStats.settledCount > 0
                      ? `${verifiedStats.roi >= 0 ? '+' : ''}${verifiedStats.roi}%`
                      : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  A régi ROI adatok nem minősülnek igazoltnak
                </span>
              </div>

              {/* Hitelesített Profit */}
              <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                  Hitelesített Nettó Profit
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      verifiedStats.settledCount === 0
                        ? 'text-slate-500'
                        : verifiedStats.netProfit >= 0
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {verifiedStats.settledCount > 0
                      ? `${verifiedStats.netProfit >= 0 ? '+' : ''}${verifiedStats.netProfit.toLocaleString('hu-HU')} Ft`
                      : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {verifiedStats.settledCount > 0
                    ? `${(verifiedStats.totalStaked / 1000).toFixed(0)}e Ft auditált össztétre`
                    : '10 000 Ft egységtét alapon'}
                </span>
              </div>

              {/* Átlagos nyertes odds */}
              <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                  Átlagos Nyertes Odds
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                    {verifiedStats.avgWinningOdds > 0 ? `@${verifiedStats.avgWinningOdds.toFixed(2)}` : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kizárólag igazolt nyertes tippekből
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* NÉZET 1: HITELESÍTETT PRE-MATCH PREDIKCIÓK */}
        {/* ============================================================== */}
        {provenanceTab === 'verified' && (
          <div className="space-y-6">
            {/* Piaci sikerteljesítmény bontás */}
            {verifiedStats.settledCount > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span className="uppercase tracking-wider text-[11px] font-bold text-slate-300">
                    Hitelesített Piaconkénti Teljesítmény (Kattints a szűréshez)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {verifiedMarketBreakdown.map((mb) => {
                    const Icon = mb.icon;
                    const isSelected = activeMarket === mb.id;
                    return (
                      <button
                        key={mb.id}
                        onClick={() => setActiveMarket(isSelected ? 'ALL' : mb.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border-amber-400 shadow-md shadow-amber-500/10 scale-[1.02]'
                            : 'bg-mesh-dark hover:border-slate-700 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <Icon className={`w-3.5 h-3.5 ${mb.color}`} />
                            <span className="truncate">{mb.label}</span>
                          </span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black text-white">{mb.total > 0 ? `${mb.winRate}%` : '—'}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {mb.won}/{mb.total} nyert
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                            <span className="text-slate-500">Audit ROI:</span>
                            <span className={`font-mono font-bold ${mb.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {mb.total > 0 ? `${mb.roi >= 0 ? '+' : ''}${mb.roi}%` : '—'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Szűrősáv */}
            <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 text-amber-400" />
                  Státusz:
                </span>
                {(['ALL', 'PENDING', 'WON', 'LOST'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeStatus === status
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {status === 'ALL' && 'Összes'}
                    {status === 'PENDING' && '⏳ Kezdésre vár'}
                    {status === 'WON' && '✓ Nyertes'}
                    {status === 'LOST' && '✗ Vesztes'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {distinctAuditLeagues.length > 0 && (
                  <select
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ALL">Minden bajnokság</option>
                    {distinctAuditLeagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flag || '⚽'} {l.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* MECCS KÁRTYÁK LISTÁJA */}
            {filteredAuditRecords.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-mesh-card border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {verifiedRecords.length === 0
                    ? 'A Megmásíthatatlan Audit Napló Aktív'
                    : 'Nincs a szűrőknek megfelelő auditált mérkőzés'}
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                  {verifiedRecords.length === 0 ? (
                    <>
                      A rendszer kizárólag a <strong>kezdőrúgás előtt naplózott</strong> predikciókat fogadja el hitelesnek. A régi, utólagos vagy demó meccsek ROI-ját a hitelességi szabályzat kizárja. Amint egy élő meccs a jövőbeli kezdés előtt bekerül, a predikció azonnal fagyasztásra kerül!
                    </>
                  ) : (
                    'Válassz másik szűrőt a rögzített audit bejegyzések megtekintéséhez.'
                  )}
                </p>
                {verifiedStats.pendingCount > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jelenleg <strong>{verifiedStats.pendingCount} mérkőzés</strong> áll fagyasztott tippel kezdésre/lefújásra várva.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAuditRecords.map((record) => {
                  const isWon = record.status === 'WON';
                  const isPending = !record.settled;
                  const isLost = record.status === 'LOST';

                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-2xl bg-mesh-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      {/* Fejléc: Liga + Audit Hash + Státusz címke */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate max-w-[60%]">
                            <span>{record.leagueFlag || '⚽'}</span>
                            <span className="truncate">{record.leagueName}</span>
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isPending ? (
                              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> FÜGGŐBEN
                              </span>
                            ) : isWon ? (
                              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> NYERTES
                              </span>
                            ) : (
                              <span className="font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" /> VESZTES
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Audit pecsét: rögzítés időpontja + integrity hash */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Pre-Match: {record.kickoffDate} {record.kickoffTime}</span>
                          </span>
                          <span className="text-slate-500 truncate max-w-[110px]" title={`Audit Aláírás: ${record.auditHash}`}>
                            {record.auditHash}
                          </span>
                        </div>
                      </div>

                      {/* Csapatok és Eredmény */}
                      <div className="py-2.5 flex items-center justify-between border-y border-slate-800/80">
                        <div className="space-y-1.5 min-w-0 pr-2 flex-1">
                          <div className="flex items-center gap-2">
                            {record.homeTeam.logo && (
                              <img src={record.homeTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {record.homeTeam.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.awayTeam.logo && (
                              <img src={record.awayTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                              {record.awayTeam.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono font-black text-lg text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                          {record.settled && typeof record.homeScore === 'number' ? (
                            <>
                              <div>{record.homeScore}</div>
                              <div>{record.awayScore}</div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-sans">vs</span>
                          )}
                        </div>
                      </div>

                      {/* Rögzített Pre-Match MI Tipp Doboz */}
                      <div className="space-y-1.5">
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isPending
                              ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                              : isWon
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-red-500/10 border-red-500/30 text-red-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[9px] uppercase font-bold block opacity-75">
                              {isPending ? 'FAGYASZTOTT PRE-MATCH TIPP' : isWon ? 'HITELTESÍTETT TALÁLAT' : 'NEM JÖTT BE'}
                            </span>
                            <span className="font-extrabold truncate block text-white">
                              {record.pick.marketLabel}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs bg-slate-950 px-2 py-0.5 rounded text-white border border-slate-800 block">
                              @{record.pick.odds.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Auditált profit vagy pending állapot */}
                        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                          <span>{isPending ? 'Státusz:' : 'Hitelesített egyenleg:'}</span>
                          <span
                            className={`font-mono font-bold ${
                              isPending
                                ? 'text-amber-400'
                                : isWon
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {isPending
                              ? 'Kezdésre / Lefújásra vár'
                              : isWon
                              ? `+${record.profit.toLocaleString('hu-HU')} Ft`
                              : `${record.profit.toLocaleString('hu-HU')} Ft`}
                          </span>
                        </div>
                      </div>

                      {/* Indoklás */}
                      {record.pick.reasoning && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 pt-1 border-t border-slate-800/60">
                          &bdquo;{record.pick.reasoning}&ldquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* NÉZET 2: NEM AUDITÁLT KÜLSŐ ARCHÍVUM (TÁJÉKOZTATÓ JELLEGŰ) */}
        {/* ============================================================== */}
        {provenanceTab === 'unverified' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Tájékoztató jellegű előzmények – Nem minősülnek igazolt modell-teljesítménynek</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Az alábbi mérkőzések az API-ból vagy a böngésző korábbi mentéseiből származnak, és nem rendelkeznek kezdés előtti megmásíthatatlan audit naplóbejegyzéssel. A szigorú hitelességi irányelv értelmében <strong>ezek NEM számítanak bele a hivatalos megtérülési (ROI) és találati statisztikákba</strong>.
              </p>
            </div>

            {unverifiedFinishedMatches.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-mesh-card border border-slate-800 text-slate-400 text-xs">
                Nincsenek külső nem auditált lezárt meccsek az archívumban.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unverifiedFinishedMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
                    className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3 opacity-90 hover:opacity-100"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{match.leagueFlag}</span>
                        <span className="truncate">{match.leagueName}</span>
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                        {match.kickoffDate}
                      </span>
                    </div>

                    <div className="py-2 flex items-center justify-between border-y border-slate-800/60">
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-white">{match.homeTeam.name}</div>
                        <div className="text-slate-300">{match.awayTeam.name}</div>
                      </div>
                      <div className="font-mono font-bold text-base text-amber-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {match.homeScore} : {match.awayScore}
                      </div>
                    </div>

                    {match.aiPick && (
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Tipp: <strong className="text-white">{match.aiPick.marketLabel}</strong></span>
                        <span className="font-mono text-slate-300">@{match.aiPick.odds.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
