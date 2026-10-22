import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Match, DayFilter, BetSlipItem } from './types/football';
import { MOCK_MATCHES, LEAGUES } from './data/mockMatches';
import { fetchLiveMatches, getPendingLeagueModelCount } from './services/footballDataApi';
import {
  fetchApiSportsMatches,
  API_SPORTS_DEFAULT_KEY,
  attachCachedRealOddsToMatches,
} from './services/apiSportsClient';
import { Header, AppTab } from './components/Header';
import { HeroKpi } from './components/HeroKpi';
import { TopPicks } from './components/TopPicks';
import { StatsGrid } from './components/StatsGrid';
import { BetSlipDrawer } from './components/BetSlipDrawer';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatLocalDate, getRelativeDateStr } from './utils/dateUtils';
import { normalizeTeamName } from './utils/teamUtils';
import { eventBus } from './utils/eventBus';
import { isPinEnabled } from './services/pinService';
import { PinLockScreen } from './components/PinLockScreen';

const MatchDetailModal = React.lazy(() =>
  import('./components/MatchDetailModal').then((m) => ({ default: m.MatchDetailModal }))
);
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const AboutModal = React.lazy(() =>
  import('./components/AboutModal').then((m) => ({ default: m.AboutModal }))
);
const ResultsView = React.lazy(() =>
  import('./components/ResultsView').then((m) => ({ default: m.ResultsView }))
);
const BankrollView = React.lazy(() =>
  import('./components/BankrollView').then((m) => ({ default: m.BankrollView }))
);
const MethodologyView = React.lazy(() =>
  import('./components/MethodologyView').then((m) => ({ default: m.MethodologyView }))
);
const ScannerView = React.lazy(() =>
  import('./components/ScannerView').then((m) => ({ default: m.ScannerView }))
);
import {
  createTrackedBet,
  getTrackedBets,
  getInitialBankroll,
  calculateBankrollSummary,
} from './services/bankrollService';

const DEFAULT_API_KEY = '';

import { persistFinishedMatchesToHistory, getArchivedFinishedMatches } from './services/historyService';
import {
  recordPreMatchPredictions,
  settleAuditPredictions,
  getAuditLog,
} from './services/predictionAuditService';

export function App() {
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const savedDs = localStorage.getItem('focitipp_datasource');
      if (savedDs === 'builtin') {
        return MOCK_MATCHES;
      }
    } catch {
      // ignore
    }
    return [];
  });
  // Alapértelmezett fül: Napi Top Tippek ('picks')
  const [activeTab, setActiveTab] = useState<AppTab>('picks');
  const [dayFilter, setDayFilter] = useState<DayFilter>('today');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [betSlipOpen, setBetSlipOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  // A Fogadási Szelvény (vázlat) tartós megőrzése a böngésző tárolójában
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>(() => {
    try {
      const raw = localStorage.getItem('soccerai_betslip_draft');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('soccerai_betslip_draft', JSON.stringify(betSlipItems));
    } catch {
      // ignore
    }
  }, [betSlipItems]);

  // API állapotok
  const [dataSource, setDataSource] = useState<'builtin' | 'api'>(() => {
    return (localStorage.getItem('focitipp_datasource') as 'builtin' | 'api') || 'api';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apikey') || DEFAULT_API_KEY;
  });
  const [apiSportsKey, setApiSportsKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apisports_key') || API_SPORTS_DEFAULT_KEY;
  });
  const [enableSecondary, setEnableSecondary] = useState<boolean>(() => {
    return localStorage.getItem('focitipp_enable_secondary') !== 'false';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiSuccessNotice, setApiSuccessNotice] = useState<string | null>(null);
  const [apiErrorNotice, setApiErrorNotice] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // 6-jegyű PIN biztonsági zárolás állapotok
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => isPinEnabled());
  const [isLocked, setIsLocked] = useState<boolean>(() => isPinEnabled());

  useEffect(() => {
    const unsubState = eventBus.on('pin_state_changed', () => {
      const enabled = isPinEnabled();
      setPinEnabled(enabled);
      if (!enabled) {
        setIsLocked(false);
      }
    });

    const unsubLock = eventBus.on('pin_locked', () => {
      if (isPinEnabled()) {
        setIsLocked(true);
      }
    });

    return () => {
      unsubState();
      unsubLock();
    };
  }, []);

  // Modell-építés újrapróbálása: az ingyenes kulcs 10 kérés/perc keretébe nem fér bele minden liga előzménye
  // az első betöltéskor, ezért a pihenő után automatikusan folytatjuk (legfeljebb MAX_MODEL_RETRIES alkalommal).
  const MAX_MODEL_RETRIES = 8;
  const MODEL_RETRY_DELAY_MS = 65 * 1000;
  const modelRetryCountRef = useRef(0);
  const modelRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMatchesRef = useRef<
    ((source: 'builtin' | 'api', fbKey: string, sportsKey?: string, secEnabled?: boolean, forceRefresh?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    return () => {
      if (modelRetryTimerRef.current) clearTimeout(modelRetryTimerRef.current);
    };
  }, []);

  // Élő meccsek betöltése (Football-Data.org Top ligák + API-Sports másodosztályok és NB I)
  const loadMatches = useCallback(
    async (
      source: 'builtin' | 'api',
      fbKey: string,
      sportsKey: string = apiSportsKey,
      secEnabled: boolean = enableSecondary,
      forceRefresh: boolean = false
    ) => {
      if (source === 'builtin') {
        // Kizárólag akkor töltünk be mintát, ha a felhasználó kifejezetten a Szimulációs Módot választotta!
        setMatches(MOCK_MATCHES);
        setIsDemoMode(true);
        setApiSuccessNotice(null);
        setApiErrorNotice(null);
        // Mintamódban is biztosítjuk az eredmények megőrzését és audit zárását
        persistFinishedMatchesToHistory(MOCK_MATCHES);
        settleAuditPredictions(MOCK_MATCHES);
        return;
      }

      setIsLoading(true);
      setApiErrorNotice(null);
      try {
        let mainFailed = false;
        const liveMainPromise = fetchLiveMatches(fbKey, forceRefresh).catch((e) => {
          console.warn('Football-Data.org hiba:', e);
          mainFailed = true;
          return [] as Match[];
        });

        // Átmeneti hiba (kvótapihenő) vagy hiányzó ligamodellek esetén automatikus újrapróbálás a pihenő után
        const scheduleRetry = (needed: boolean) => {
          if (modelRetryTimerRef.current) {
            clearTimeout(modelRetryTimerRef.current);
            modelRetryTimerRef.current = null;
          }
          if (needed && modelRetryCountRef.current < MAX_MODEL_RETRIES) {
            modelRetryCountRef.current += 1;
            modelRetryTimerRef.current = setTimeout(() => {
              loadMatchesRef.current?.(source, fbKey, sportsKey, secEnabled, true);
            }, MODEL_RETRY_DELAY_MS);
          } else if (!needed) {
            modelRetryCountRef.current = 0;
          }
        };

        const liveSecondaryPromise = secEnabled
          ? fetchApiSportsMatches(sportsKey, undefined, forceRefresh).catch((e) => {
              console.warn('API-Sports másodosztályok lekérési hiba:', e);
              return [] as Match[];
            })
          : Promise.resolve([] as Match[]);

        const [liveMain, liveSecondary] = await Promise.all([liveMainPromise, liveSecondaryPromise]);

        const combinedRaw = [...liveMain, ...liveSecondary];
        // Deduplikáció (ha mindkét API szolgáltatná ugyanazt a meccset pl. Primeira Liga esetén)
        // Teljes, egységes normalizeTeamName-t használunk .slice(0, 5) csonkolás nélkül,
        // így az azonos előtagú csapatok (Man City / Man Utd, Real Madrid / Betis / Balompédica,
        // Sheffield Utd / Wed, Bristol City / Rovers) soha nem ütköznek össze.
        const seen = new Set<string>();
        const combined = combinedRaw.filter((m) => {
          const normHome = normalizeTeamName(m.homeTeam.name);
          const normAway = normalizeTeamName(m.awayTeam.name);
          const key = `${m.kickoffDate}_${normHome}_${normAway}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (combined.length > 0) {
          // Valós gyorsítótárazott bukmékeri oddsok és lejárati idők hozzácsatolása
          const enhanced = attachCachedRealOddsToMatches(combined);
          setMatches(enhanced);
          setIsDemoMode(false);
          setApiErrorNotice(null);
          
          // 1. Kezdés előtti predikciók megváltoztathatatlan rögzítése az audit naplóba
          recordPreMatchPredictions(enhanced);
          // 2. Korábban rögzített auditált predikciók lezárása valós befejezett meccsekkel
          settleAuditPredictions(enhanced);
          // 3. Tartós előzmények
          persistFinishedMatchesToHistory(enhanced);
          const secText = liveSecondary.length > 0
            ? ` (${liveMain.length} főbajnokság + ${liveSecondary.length} egyéb európai & másodosztályú liga)`
            : '';
          const pendingModels = getPendingLeagueModelCount();
          const modelText = mainFailed
            ? ' A Football-Data főligák betöltése átmenetileg nem sikerült (kvótapihenő), automatikus újrapróbálás.'
            : pendingModels > 0
            ? ` Modell-építés folyamatban: ${pendingModels} liga még hátra, automatikus újrapróbálás.`
            : '';
          setApiSuccessNotice(
            `Sikeres szinkronizáció! ${combined.length} valós mérkőzés elérhető${secText}.${modelText}`
          );

          scheduleRetry(mainFailed || pendingModels > 0);
        } else {
          scheduleRetry(true);
          // NEM helyettesítünk be kamu meccseket!
          setMatches([]);
          setIsDemoMode(false);
          setApiSuccessNotice(null);
          setApiErrorNotice(
            'Nem érkezett valós mérkőzés az API-tól a megadott időszakra (vagy a lekérési kvóta épp pihen). Nem töltünk be kamu adatokat. Kérlek várj pár másodpercet és kattints az újratöltésre!'
          );
        }
      } catch (err: unknown) {
        console.error('API lekérési hiba:', err);
        setMatches([]);
        setIsDemoMode(false);
        setApiSuccessNotice(null);
        const errMsg = err instanceof Error ? err.message : 'Ismeretlen hálózati hiba';
        setApiErrorNotice(
          `API szinkronizációs hiba: ${errMsg}. Nem használunk kamu/mock adatokat. Kérlek próbáld újra pár másodperc múlva!`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiSportsKey, enableSecondary]
  );

  useEffect(() => {
    loadMatchesRef.current = loadMatches;
  }, [loadMatches]);

  // Első betöltéskor
  useEffect(() => {
    // Ha az archív előzménytár még teljesen üres, feltöltjük az induló lezárt mérkőzésekkel
    if (getArchivedFinishedMatches().length === 0) {
      persistFinishedMatchesToHistory(MOCK_MATCHES);
    }
    loadMatches(dataSource, apiKey, apiSportsKey, enableSecondary, false);
  }, [dataSource, apiKey, apiSportsKey, enableSecondary, loadMatches]);

  // Értesítés eltüntetése 5mp után
  useEffect(() => {
    if (apiSuccessNotice) {
      const t = setTimeout(() => setApiSuccessNotice(null), 5000);
      return () => clearTimeout(t);
    }
  }, [apiSuccessNotice]);

  useEffect(() => {
    if (apiErrorNotice) {
      const t = setTimeout(() => setApiErrorNotice(null), 8000);
      return () => clearTimeout(t);
    }
  }, [apiErrorNotice]);

  // PWA Service Worker frissítés detektálás ("Új verzió elérhető")
  const [swUpdateReg, setSwUpdateReg] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    const handleSwUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<ServiceWorkerRegistration>;
      if (customEvt.detail) {
        setSwUpdateReg(customEvt.detail);
      }
    };
    window.addEventListener('sw-update-available', handleSwUpdate);
    return () => window.removeEventListener('sw-update-available', handleSwUpdate);
  }, []);

  const handleApplySwUpdate = () => {
    if (swUpdateReg?.waiting) {
      swUpdateReg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  // Automatikus háttérfrissítés 10 percenként, ha a fül látható/aktív
  useEffect(() => {
    if (dataSource !== 'api') return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadMatches('api', apiKey, apiSportsKey, enableSecondary, true);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dataSource, apiKey, apiSportsKey, enableSecondary, loadMatches]);

  const handleRefresh = () => {
    loadMatches(dataSource, apiKey, apiSportsKey, enableSecondary, true);
  };

  const handleSaveConfig = (
    newSource: 'builtin' | 'api',
    newKey: string,
    newSportsKey?: string,
    newSecEnabled?: boolean
  ) => {
    const sKey = newSportsKey || apiSportsKey;
    const sEnabled = newSecEnabled !== undefined ? newSecEnabled : enableSecondary;
    setDataSource(newSource);
    setApiKey(newKey);
    if (newSportsKey) setApiSportsKey(newSportsKey);
    if (newSecEnabled !== undefined) setEnableSecondary(newSecEnabled);
    loadMatches(newSource, newKey, sKey, sEnabled, true);
  };

  // Szelvényhez adás (duplikáció és integritás-szűréssel: nem vehetők fel lezárt vagy elkezdődött meccsek)
  const handleAddToBetSlip = (item: BetSlipItem) => {
    if (
      item.matchStatus === 'FINISHED' ||
      item.matchStatus === 'LIVE' ||
      item.matchStatus === 'POSTPONED' ||
      item.matchStatus === 'CANCELLED' ||
      item.matchStatus === 'SUSPENDED'
    ) {
      setApiErrorNotice(
        `A mérkőzés állapota (${item.matchStatus}) miatt már nem adható a szelvényhez.`
      );
      return;
    }
    if (item.kickoffDate) {
      const kickoffTime = item.kickoffTime || '00:00';
      const kickoffMs = new Date(`${item.kickoffDate}T${kickoffTime}:00`).getTime();
      if (!isNaN(kickoffMs) && kickoffMs <= Date.now()) {
        setApiErrorNotice(
          'A mérkőzés már elkezdődött, a szelvényre kizárólag pre-match események vehetők fel.'
        );
        return;
      }
    }

    setBetSlipItems((prev) => {
      const exists = prev.some(
        (i) => i.matchId === item.matchId && i.marketLabel === item.marketLabel
      );
      if (exists) {
        return prev.filter(
          (i) => !(i.matchId === item.matchId && i.marketLabel === item.marketLabel)
        );
      }
      return [...prev, item];
    });
  };

  const handleRemoveBetSlipItem = (index: number) => {
    setBetSlipItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveInvalidBetSlipItems = () => {
    setBetSlipItems((prev) => {
      return prev.filter((item) => {
        if (
          item.matchStatus === 'FINISHED' ||
          item.matchStatus === 'LIVE' ||
          item.matchStatus === 'POSTPONED' ||
          item.matchStatus === 'CANCELLED' ||
          item.matchStatus === 'SUSPENDED'
        ) {
          return false;
        }
        if (item.kickoffDate) {
          const kickoffTime = item.kickoffTime || '00:00';
          const kickoffMs = new Date(`${item.kickoffDate}T${kickoffTime}:00`).getTime();
          if (!isNaN(kickoffMs) && kickoffMs <= Date.now()) {
            return false;
          }
        }
        return true;
      });
    });
  };

  const handleClearBetSlip = () => {
    setBetSlipItems([]);
  };

  // Szinkronizáció a meccsek friss állapotával (élővé válás, befejezés, halasztás)
  useEffect(() => {
    if (betSlipItems.length === 0 || matches.length === 0) return;
    const matchMap = new Map(matches.map((m) => [m.id, m]));
    let changed = false;
    const updated = betSlipItems.map((item) => {
      const liveMatch = matchMap.get(item.matchId);
      if (!liveMatch) return item;
      if (
        item.matchStatus !== liveMatch.status ||
        item.kickoffDate !== liveMatch.kickoffDate ||
        item.kickoffTime !== liveMatch.kickoffTime
      ) {
        changed = true;
        return {
          ...item,
          matchStatus: liveMatch.status,
          kickoffDate: liveMatch.kickoffDate,
          kickoffTime: liveMatch.kickoffTime,
        };
      }
      return item;
    });
    if (changed) {
      setBetSlipItems(updated);
    }
  }, [matches, betSlipItems]);

  // Bankroll állapotkezelés
  const [currentBankroll, setCurrentBankroll] = useState<number>(() => {
    const b = getTrackedBets();
    const c = getInitialBankroll();
    const s = calculateBankrollSummary(b, c);
    return s.currentBankroll;
  });

  const updateBankrollState = useCallback(() => {
    const b = getTrackedBets();
    const c = getInitialBankroll();
    const s = calculateBankrollSummary(b, c);
    setCurrentBankroll(s.currentBankroll);
  }, []);

  const handleSaveToTracker = (items: BetSlipItem[], stake: number, notes?: string) => {
    createTrackedBet(items, stake, notes);
    updateBankrollState();
    setApiSuccessNotice(
      `Szelvény (${items.length} esemény, ${stake.toLocaleString('hu-HU')} Ft) sikeresen rögzítve a Tétnaplóban!`
    );
  };

  // Dinamikus KPI kalkulációk a mai meccsekből
  const todayDateStr = useMemo(() => formatLocalDate(), []);

  const todayMatches = useMemo(() => {
    const t = matches.filter((m) => m.kickoffDate === todayDateStr || m.status === 'LIVE');
    return t.length > 0 ? t : matches;
  }, [matches, todayDateStr]);

  const distinctLeagueCount = useMemo(() => {
    const set = new Set(matches.map((m) => m.leagueId));
    return set.size > 0 ? set.size : LEAGUES.length;
  }, [matches]);

  const strongSignalsCount = useMemo(() => {
    let count = 0;
    todayMatches.forEach((m) => {
      const p = m.probabilities;
      if (p.homeWin >= 60) count++;
      if (p.awayWin >= 60) count++;
      if (p.bttsYes >= 60) count++;
      if (p.over25 >= 60) count++;
    });
    return count;
  }, [todayMatches]);

  const yesterdayDateStr = useMemo(() => getRelativeDateStr(-1), []);
  const yesterdayStat = useMemo(() => {
    // Szigorú integritási ellenőrzés:
    // Kizárólag a hitelesített audit naplóban szereplő, kezdés előtt rögzített és tegnap lezárt meccsek számítanak!
    // A régi/nem auditált vagy demó meccsek ROI-ját és találatát nem tekintjük igazolt eredménynek.
    const auditLog = getAuditLog();
    const verifiedSettledYesterday = auditLog.filter(
      (r) =>
        r.provenance === 'VERIFIED_PRE_MATCH' &&
        r.settled &&
        r.kickoffDate === yesterdayDateStr
    );
    if (verifiedSettledYesterday.length === 0) return null;
    const won = verifiedSettledYesterday.filter((r) => r.status === 'WON').length;
    return {
      won,
      total: verifiedSettledYesterday.length,
      winRate: Math.round((won / verifiedSettledYesterday.length) * 100),
    };
  }, [yesterdayDateStr, matches]);

  const liveMatchCount = useMemo(
    () => matches.filter((m) => m.status === 'LIVE').length,
    [matches]
  );

  const handleGoToLive = () => {
    setActiveTab('grid');
    setTimeout(() => {
      eventBus.emit('filter_live');
    }, 10);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. Felső Navigációs Sáv */}
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenBetSlip={() => setBetSlipOpen(true)}
        betSlipCount={betSlipItems.length}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'bankroll') updateBankrollState();
        }}
        isLiveApi={dataSource === 'api' && !isDemoMode}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        currentBankroll={currentBankroll}
        liveMatchCount={liveMatchCount}
        onGoToLive={handleGoToLive}
        isPinEnabled={pinEnabled}
        onLockApp={() => setIsLocked(true)}
      />

      {/* Új PWA verzió elérhető sáv */}
      {swUpdateReg && (
        <div className="bg-cyan-500/20 border-b border-cyan-500/40 px-4 py-2 text-center text-xs text-cyan-200 font-bold flex items-center justify-center gap-3">
          <span>🔄 Új alkalmazásverzió érhető el!</span>
          <button
            onClick={handleApplySwUpdate}
            className="px-2.5 py-0.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black transition-colors cursor-pointer"
          >
            Frissítés most
          </button>
        </div>
      )}

      {/* Demó adat / Mock fallback figyelmeztető sáv */}
      {isDemoMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Demó adat (szimulált mód): A megjelenített mérkőzések, csapaterősségek és szorzók beépített mintaadatok.
          </span>
        </div>
      )}

      {/* Sikeres API csatlakozás banner */}
      {apiSuccessNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{apiSuccessNotice}</span>
        </div>
      )}

      {/* API Hiba / Figyelmeztető banner */}
      {apiErrorNotice && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2.5 text-center text-xs text-rose-300 font-bold flex items-center justify-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{apiErrorNotice}</span>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 rounded bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold transition-colors cursor-pointer border border-rose-500/40 text-[11px]"
          >
            Újrapróbálás
          </button>
        </div>
      )}

      {/* 2. Kompakt Állapotsáv & Hőtérkép Jelmagyarázat */}
      <HeroKpi
        matchCount={todayMatches.length}
        leagueCount={distinctLeagueCount}
        strongSignalCount={strongSignalsCount}
        yesterdayStat={yesterdayStat}
        onExplorePicks={() => setActiveTab('picks')}
        onOpenMethodology={() => setActiveTab('methodology')}
      />

      {/* 3. Fő Tartalom az aktív fül szerint (minden fül szigorúan csak a saját nézetét mutatja) */}
      <main className="flex-1">
        {matches.length === 0 && !isLoading && (
          <div className="max-w-xl mx-auto my-12 p-8 bg-mesh-card border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Nincs betöltött mérkőzés</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Az élő API-ról jelenleg nem érkezett mérkőzés a megadott időszakra. A rendszer szigorúan elutasítja a kamu/mock adatokat, így kizárólag valós, hiteles meccsek jelenhetnek meg.
            </p>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              🔄 Élő adatok lekérése most
            </button>
          </div>
        )}

        {activeTab === 'picks' && (
          <TopPicks
            matches={todayMatches}
            onSelectMatch={setSelectedMatch}
            onAddToBetSlip={handleAddToBetSlip}
            betSlipItems={betSlipItems}
            onSwitchToGrid={() => setActiveTab('grid')}
          />
        )}

        {activeTab === 'grid' && (
          <StatsGrid
            matches={matches}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            onSelectMatch={setSelectedMatch}
            onAddToBetSlip={handleAddToBetSlip}
            betSlipItems={betSlipItems}
          />
        )}

        <React.Suspense
          fallback={
            <div className="py-20 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              <span>Modul betöltése...</span>
            </div>
          }
        >
          {activeTab === 'scanner' && (
            <ScannerView
              matches={matches}
              onSelectMatch={setSelectedMatch}
              onAddToBetSlip={handleAddToBetSlip}
              betSlipItems={betSlipItems}
            />
          )}

          {activeTab === 'results' && (
            <ResultsView matches={matches} onSelectMatch={setSelectedMatch} />
          )}

          {activeTab === 'bankroll' && (
            <BankrollView
              matches={matches}
              onOpenBetSlip={() => setBetSlipOpen(true)}
              onGoToGrid={() => setActiveTab('grid')}
            />
          )}

          {activeTab === 'methodology' && (
            <MethodologyView
              onGoToGrid={() => setActiveTab('grid')}
              onGoToPicks={() => setActiveTab('picks')}
            />
          )}
        </React.Suspense>
      </main>

      {/* 4. Modális komponensek */}
      <React.Suspense fallback={null}>
        {selectedMatch && (
          <MatchDetailModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onAddToBetSlip={handleAddToBetSlip}
            betSlipItems={betSlipItems}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onOpenAbout={() => setAboutOpen(true)}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {aboutOpen && (
          <AboutModal
            isOpen={aboutOpen}
            onClose={() => setAboutOpen(false)}
          />
        )}
      </React.Suspense>

      <BetSlipDrawer
        isOpen={betSlipOpen}
        onClose={() => setBetSlipOpen(false)}
        items={betSlipItems}
        onRemoveItem={handleRemoveBetSlipItem}
        onClearAll={handleClearBetSlip}
        onRemoveInvalid={handleRemoveInvalidBetSlipItems}
        onSaveToTracker={handleSaveToTracker}
        onOpenBankroll={() => {
          updateBankrollState();
          setActiveTab('bankroll');
        }}
        currentBankroll={currentBankroll}
      />

      {/* 5. Biztonsági 6-jegyű PIN Kód Zárolási Képernyő */}
      {pinEnabled && isLocked && (
        <PinLockScreen onUnlock={() => setIsLocked(false)} />
      )}

    </div>
  );
}

export default App;
