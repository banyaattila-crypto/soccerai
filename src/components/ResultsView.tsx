import { ResultEntryCard } from './results/ResultEntryCard';
import { AuditKpiGrid } from './results/AuditKpiGrid';
import { ClvKpiRow } from './results/ClvKpiRow';
import { getClvStats, getRealOddsRoi } from '../services/clvService';
import { ProvenanceTabs } from './results/ProvenanceTabs';
import { MarketBreakdown } from './results/MarketBreakdown';
import React, { useState, useMemo, useCallback } from 'react';
import { Match, PredictionAuditRecord } from '../types/football';
import { useEventBus } from '../utils/eventBus';
import {
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
  Check,
  RotateCcw,
} from 'lucide-react';
import { getRelativeDateStr } from '../utils/dateUtils';
import {
  getAuditLog,
  getVerifiedAuditStats,
  exportAuditLogAsJson,
  importAuditLogFromJson,
  AUDIT_BASE_STAKE,
} from '../services/predictionAuditService';
import { getArchivedFinishedMatches, MAX_ARCHIVED_MATCHES } from '../services/historyService';
import {
  evaluatePickWon,
  getMarketCategory,
  type MarketCategory,
} from '../services/betEvaluation';

export { evaluatePickWon, getMarketCategory, type MarketCategory };

export type StatusFilter = 'ALL' | 'WON' | 'LOST' | 'PENDING';
export type ProvenanceViewTab = 'all' | 'verified' | 'unverified';

interface ResultsViewProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export interface UnifiedResultEntry {
  type: 'verified' | 'unverified';
  id: string;
  matchId: string;
  leagueId: string;
  leagueName: string;
  leagueFlag?: string;
  homeTeam: { id?: string; name: string; logo?: string };
  awayTeam: { id?: string; name: string; logo?: string };
  kickoffDate: string;
  kickoffTime: string;
  homeScore?: number;
  awayScore?: number;
  settled: boolean;
  status: 'WON' | 'LOST' | 'VOID' | 'PENDING';
  pickLabel?: string;
  pickOdds?: number;
  pickMarket?: string;
  profit?: number;
  roi?: number;
  reasoning?: string;
  auditHash?: string;
  rawRecord?: PredictionAuditRecord;
  rawMatch?: Match;
}

/**
 * Dátum fejléc humán formázása magyar nyelven (pl. "Ma – 2026. október 21., szerda")
 */
function formatHungarianDateHeader(dateStr: string, todayStr: string, yesterdayStr: string): string {
  if (!dateStr || dateStr === 'Egyéb') return 'Egyéb időpont';
  let prefix = '';
  if (dateStr === todayStr) prefix = 'Ma – ';
  else if (dateStr === yesterdayStr) prefix = 'Tegnap – ';

  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
      return `${prefix}${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
    }
  } catch {
    // A dátumformázás nem sikerült: lent a nyers dátumszöveg a tartalék
  }
  return `${prefix}${dateStr}`;
}

/**
 * Biztosítja, hogy egy audit rekordból is nyitható legyen a mérkőzés részletes modális ablaka
 */
function auditRecordToMatch(r: PredictionAuditRecord, existingMatches: Match[]): Match {
  const found = existingMatches.find((m) => m.id === r.matchId);
  if (found) return found;

  return {
    id: r.matchId,
    leagueId: r.leagueId,
    leagueName: r.leagueName,
    leagueCountry: r.leagueCountry || 'Európa',
    leagueFlag: r.leagueFlag || '⚽',
    homeTeam: {
      id: 'home',
      name: r.homeTeam.name,
      shortName: r.homeTeam.shortName || r.homeTeam.name.slice(0, 3).toUpperCase(),
      logo: r.homeTeam.logo || '',
      rank: 0,
      form: [],
      xgAvg: 1.3,
      goalsScoredAvg: 1.3,
      goalsConcededAvg: 1.2,
    },
    awayTeam: {
      id: 'away',
      name: r.awayTeam.name,
      shortName: r.awayTeam.shortName || r.awayTeam.name.slice(0, 3).toUpperCase(),
      logo: r.awayTeam.logo || '',
      rank: 0,
      form: [],
      xgAvg: 1.1,
      goalsScoredAvg: 1.1,
      goalsConcededAvg: 1.4,
    },
    kickoffDate: r.kickoffDate,
    kickoffTime: r.kickoffTime,
    status: r.settled ? 'FINISHED' : 'UPCOMING',
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    odds: {
      home: 2.0,
      draw: 3.2,
      away: 3.6,
      over25: 1.85,
      bttsYes: 1.8,
      under25: 1.95,
    },
    aiPick: {
      market: r.pick.market as unknown as Match['aiPick'] extends { market: infer M } ? M : never,
      marketLabel: r.pick.marketLabel,
      probability: r.pick.probability,
      odds: r.pick.odds,
      confidence: 7,
      expectedValue: 0.05,
      reasoning: r.pick.reasoning || '',
    },
    probabilities: r.modelSnapshot?.probabilities || {
      homeWin: 45,
      draw: 27,
      awayWin: 28,
      over15: 75,
      over25: 52,
      over35: 30,
      bttsYes: 54,
      fhOver05: 70,
    },
  };
}

export const ResultsView: React.FC<ResultsViewProps> = ({ matches, onSelectMatch }) => {
  // Alapértelmezés: 'all' (Összes Eredmény), hogy a felhasználó sose lásson üres képernyőt!
  const [provenanceTab, setProvenanceTab] = useState<ProvenanceViewTab>('all');
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

  // Reakció az audit napló frissüléseire típusbiztos eventBus-on keresztül
  const handleAuditUpdate = useCallback(() => setAuditLogUpdateKey((prev) => prev + 1), []);
  useEventBus('audit_log_updated', handleAuditUpdate);

  // 1. Audit napló betöltése a megmásíthatatlan tárolóból
  const auditRecords = useMemo(() => {
    return getAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditLogUpdateKey, matches]);

  // Hitelesített pre-match rekordok szűrése
  const verifiedRecords = useMemo(() => {
    return auditRecords.filter((r) => r.provenance === 'VERIFIED_PRE_MATCH');
  }, [auditRecords]);

  // CLV és valós szorzós statisztika a hitelesített naplóból
  const clvStats = useMemo(() => getClvStats(verifiedRecords), [verifiedRecords]);
  const realOddsRoi = useMemo(() => getRealOddsRoi(verifiedRecords), [verifiedRecords]);

  // 2. Hitelesített hivatalos statisztikák kiszámítása (KIZÁRÓLAG lezárt pre-match meccsekből!)
  const verifiedStats = useMemo(() => {
    return getVerifiedAuditStats(auditRecords, AUDIT_BASE_STAKE);
  }, [auditRecords]);

  // 3. Nem auditált lezárt meccsek (API vagy korábbi mentések)
  const unverifiedFinishedMatches = useMemo(() => {
    const liveFinished = matches.filter((m) => m.status === 'FINISHED');
    const archived = getArchivedFinishedMatches();
    const map = new Map<string, Match>();

    // Az auditált meccsek ID-jai, hogy ne duplázódjanak
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

  // 4. Egységesített rekordok előállítása (Unified Result Entries)
  const unifiedEntries: UnifiedResultEntry[] = useMemo(() => {
    const list: UnifiedResultEntry[] = [];

    // Hitelesített rekordok felvétele
    verifiedRecords.forEach((r) => {
      list.push({
        type: 'verified',
        id: `audit_${r.id}`,
        matchId: r.matchId,
        leagueId: r.leagueId,
        leagueName: r.leagueName,
        leagueFlag: r.leagueFlag,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        kickoffDate: r.kickoffDate,
        kickoffTime: r.kickoffTime || '00:00',
        homeScore: r.homeScore,
        awayScore: r.awayScore,
        settled: r.settled,
        status: r.status,
        pickLabel: r.pick.marketLabel,
        pickOdds: r.pick.odds,
        pickMarket: r.pick.market,
        profit: r.profit,
        roi: r.roi,
        reasoning: r.pick.reasoning,
        auditHash: r.auditHash,
        rawRecord: r,
      });
    });

    // Archív nem auditált lezárt meccsek felvétele
    unverifiedFinishedMatches.forEach((m) => {
      let pickWonStatus: 'WON' | 'LOST' | 'VOID' | 'PENDING' = 'VOID';
      let profit: number | undefined;
      let roi: number | undefined;

      if (m.aiPick && typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
        const won = evaluatePickWon(m.homeScore, m.awayScore, m.aiPick.market, m.aiPick.marketLabel);
        if (won === true) {
          pickWonStatus = 'WON';
          profit = Math.round((m.aiPick.odds - 1) * AUDIT_BASE_STAKE);
          roi = Math.round((m.aiPick.odds - 1) * 1000) / 10;
        } else if (won === false) {
          pickWonStatus = 'LOST';
          profit = -AUDIT_BASE_STAKE;
          roi = -100;
        }
      }

      list.push({
        type: 'unverified',
        id: `match_${m.id}`,
        matchId: m.id,
        leagueId: m.leagueId,
        leagueName: m.leagueName,
        leagueFlag: m.leagueFlag,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffDate: m.kickoffDate,
        kickoffTime: m.kickoffTime || '00:00',
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        settled: m.status === 'FINISHED',
        status: pickWonStatus,
        pickLabel: m.aiPick?.marketLabel,
        pickOdds: m.aiPick?.odds,
        pickMarket: m.aiPick?.market,
        profit,
        roi,
        reasoning: m.aiPick?.reasoning,
        rawMatch: m,
      });
    });

    // Rendezés: legfrissebb meccsek elöl
    return list.sort((a, b) => {
      const dateA = `${a.kickoffDate}T${a.kickoffTime}`;
      const dateB = `${b.kickoffDate}T${b.kickoffTime}`;
      return dateB.localeCompare(dateA);
    });
  }, [verifiedRecords, unverifiedFinishedMatches]);

  // 5. Hitelesített piaci bontás (a KPI sávhoz)
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

  // 6. Elérhető ligák az összes rekordból
  const distinctLeagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; flag?: string }>();
    unifiedEntries.forEach((entry) => {
      if (!map.has(entry.leagueId)) {
        map.set(entry.leagueId, {
          id: entry.leagueId,
          name: entry.leagueName,
          flag: entry.leagueFlag,
        });
      }
    });
    return Array.from(map.values());
  }, [unifiedEntries]);

  // 7. Szűrt elemek a fülválasztó és egyéb szűrők alapján
  const filteredEntries = useMemo(() => {
    return unifiedEntries.filter((entry) => {
      // Fül szerinti szűrés
      if (provenanceTab === 'verified' && entry.type !== 'verified') return false;
      if (provenanceTab === 'unverified' && entry.type !== 'unverified') return false;

      // Időszaki szűrő
      if (periodFilter === 'TODAY' && entry.kickoffDate !== todayStr) return false;
      if (periodFilter === 'YESTERDAY' && entry.kickoffDate !== yesterdayStr) return false;
      if (periodFilter === 'WEEK') {
        const d = new Date(entry.kickoffDate).getTime();
        const now = Date.now();
        if (Number.isNaN(d) || now - d > 7 * 24 * 60 * 60 * 1000) return false;
      }

      // Piaci kategória szűrő
      if (activeMarket !== 'ALL') {
        if (!entry.pickMarket) return false;
        const cat = getMarketCategory(entry.pickMarket, entry.pickLabel);
        if (cat !== activeMarket) return false;
      }

      // Státusz szűrő
      if (activeStatus === 'WON' && entry.status !== 'WON') return false;
      if (activeStatus === 'LOST' && entry.status !== 'LOST') return false;
      if (activeStatus === 'PENDING' && entry.settled) return false;

      // Bajnokság szűrő
      if (selectedLeague !== 'ALL' && entry.leagueId !== selectedLeague) return false;

      return true;
    });
  }, [unifiedEntries, provenanceTab, periodFilter, activeMarket, activeStatus, selectedLeague, todayStr, yesterdayStr]);

  // 8. DÁTUM SZERINT CSOPORTOSÍTOTT LISTA (Date Groups)
  const dateGroups = useMemo(() => {
    const groupsMap = new Map<string, UnifiedResultEntry[]>();

    filteredEntries.forEach((entry) => {
      const d = entry.kickoffDate || 'Egyéb';
      if (!groupsMap.has(d)) {
        groupsMap.set(d, []);
      }
      groupsMap.get(d)!.push(entry);
    });

    const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((date) => {
      const groupItems = groupsMap.get(date)!;
      const wonCount = groupItems.filter((i) => i.status === 'WON').length;
      const lostCount = groupItems.filter((i) => i.status === 'LOST').length;
      const pendingCount = groupItems.filter((i) => !i.settled).length;

      return {
        date,
        formattedHeader: formatHungarianDateHeader(date, todayStr, yesterdayStr),
        items: groupItems,
        wonCount,
        lostCount,
        pendingCount,
      };
    });
  }, [filteredEntries, todayStr, yesterdayStr]);

  // Szűrők törlése alaphelyzetbe
  const handleResetFilters = () => {
    setActiveMarket('ALL');
    setActiveStatus('ALL');
    setSelectedLeague('ALL');
    setPeriodFilter('ALL');
  };

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

  // Kártyára kattintás kezelése
  const handleCardClick = (entry: UnifiedResultEntry) => {
    if (entry.rawMatch) {
      onSelectMatch(entry.rawMatch);
    } else if (entry.rawRecord) {
      onSelectMatch(auditRecordToMatch(entry.rawRecord, matches));
    }
  };

  return (
    <div className="py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Fő fejléc & Adatmegőrzési Információk */}
        <div className="p-6 rounded-2xl bg-mesh-card border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Pre-Match Predikciónapló &amp; Befejezett Mérkőzések</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Eredmények &amp; Ellenőrizhető Megtérülés
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Minden előrejelzés szigorúan a kezdőrúgás <strong>előtt</strong> rögzítésre kerül a megmásíthatatlan naplóba (write-once audit). A lezárt mérkőzések automatikusan mentésre kerülnek és kronologikusan, naponkénti bontásban tekinthetők meg.
              </p>

              {/* Tárhely & Adatmegőrzési sáv (Válasz a "Hány napot ment el?" kérdésre) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Mentési kapacitás: <strong>max. {MAX_ARCHIVED_MATCHES} mérkőzés (~60–90 nap / 2–3 hónap)</strong> a helyi tárhelyen (FIFO).
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                  <Lock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>
                    Audit napló: <strong>{verifiedRecords.length} hitelesített</strong> pre-match bejegyzés
                  </span>
                </span>
              </div>
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
                title="Audit napló importálása JSON fájlból; az ellenőrző összeg a sérült vagy módosított rekordokat kiszűri"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Audit Import</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Audit napló másolása JSON formátumban"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedJson ? 'Másolva!' : 'Audit JSON'}</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 text-xs font-bold border border-brand-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  : 'bg-brand-500/15 border-brand-500/30 text-brand-300'
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

          {/* FŐ KPI MUTATÓK (HITELESÍTETT ADATOKBÓL) */}
          <AuditKpiGrid verifiedStats={verifiedStats} />
          <ClvKpiRow clv={clvStats} real={realOddsRoi} totalAudited={verifiedStats.totalAudited} />

          {/* Fülválasztó: Összes Eredmény vs Hitelesített Audit vs Külső Archívum */}
          <ProvenanceTabs
            active={provenanceTab}
            onChange={setProvenanceTab}
            counts={{ all: unifiedEntries.length, verified: verifiedRecords.length, unverified: unverifiedFinishedMatches.length }}
          />
        </div>

        {/* Piaci sikerteljesítmény bontás (ha vannak lezárt audit tippek) */}
        {verifiedStats.settledCount > 0 && (
          <MarketBreakdown rows={verifiedMarketBreakdown} activeMarket={activeMarket} onSelect={setActiveMarket} />
        )}

        {/* Szűrősáv */}
        <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Státusz szűrő */}
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

            {/* Időszak szűrő */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mr-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                Időszak:
              </span>
              {(
                [
                  { id: 'ALL', label: 'Mind' },
                  { id: 'TODAY', label: 'Ma' },
                  { id: 'YESTERDAY', label: 'Tegnap' },
                  { id: 'WEEK', label: '7 nap' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodFilter(p.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    periodFilter === p.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {distinctLeagues.length > 0 && (
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">Minden bajnokság</option>
                {distinctLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag || '⚽'} {l.name}
                  </option>
                ))}
              </select>
            )}

            {(activeMarket !== 'ALL' || activeStatus !== 'ALL' || selectedLeague !== 'ALL' || periodFilter !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                title="Szűrők alaphelyzetbe állítása"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* DÁTUM SZERINT CSOPORTOSÍTOTT MECCS LISTA */}
        {/* ============================================================== */}
        {filteredEntries.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-mesh-card border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Nincs a szűrőknek megfelelő mérkőzés
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Próbálj más időszaki szűrőt vagy töröld a státusz- és ligaszűrőket a lezárt mérkőzések megtekintéséhez.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Szűrők alaphelyzetbe</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {dateGroups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Dátum Csoport Fejléc */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {group.formattedHeader}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {group.items.length} mérkőzés
                    </span>
                    {group.wonCount > 0 && (
                      <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        {group.wonCount} nyert
                      </span>
                    )}
                    {group.lostCount > 0 && (
                      <span className="text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-500/30">
                        {group.lostCount} vesztett
                      </span>
                    )}
                  </div>
                </div>

                {/* Meccs Kártyák a Dátumon belül */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((entry) => (
                    <ResultEntryCard key={entry.id} entry={entry} onClick={() => handleCardClick(entry)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
