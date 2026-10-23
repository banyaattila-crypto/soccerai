import React, { useEffect, useState } from 'react';
import { AlertTriangle, Gauge } from 'lucide-react';
import { getApiSportsUsage, type ApiSportsUsage } from '../services/quotaService';
import { getOddsApiUsage, type OddsApiUsage } from '../services/oddsApiClient';

function formatResetIn(resetsAt: number, nowMs: number): string {
  const mins = Math.max(0, Math.round((resetsAt - nowMs) / 60000));
  return `${Math.floor(mins / 60)} ó ${mins % 60} p`;
}

/** The Odds API: kevés kredit esetén figyelmeztet (a havi 500-ból); a szint a hátralévő krediten múlik. */
export function oddsApiLevel(u: OddsApiUsage): 'ok' | 'low' | 'critical' | 'unknown' {
  if (u.remaining === null) return 'unknown';
  if (u.remaining < 30) return 'critical';
  if (u.remaining < 100) return 'low';
  return 'ok';
}

/**
 * Az API-keretek állapotsora: az API-Sports napi 100 kérése és a The Odds API havi 500 kreditje. Fiókhiba
 * (pl. felfüggesztés) esetén piros; ha valamelyik keret fogyóban van, borostyán; egyébként halvány, de látható.
 */
export const ApiQuotaBanner: React.FC = () => {
  const [sports, setSports] = useState<ApiSportsUsage>(() => getApiSportsUsage());
  const [odds, setOdds] = useState<OddsApiUsage>(() => getOddsApiUsage());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => {
      setSports(getApiSportsUsage());
      setOdds(getOddsApiUsage());
      setNow(Date.now());
    };
    const id = window.setInterval(tick, 15000);
    window.addEventListener('storage', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', tick);
    };
  }, []);

  const sportsLow = sports.remaining <= sports.limit * 0.3;
  const oddsLevel = oddsApiLevel(odds);
  const critical = Boolean(sports.issue) || oddsLevel === 'critical';
  const warn = !critical && (sportsLow || oddsLevel === 'low');
  const sportsUsed = sports.limit - sports.remaining;

  const tone = critical
    ? 'bg-red-500/10 border-red-500/30 text-red-300'
    : warn
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    : 'bg-slate-900/60 border-slate-800 text-slate-500';

  return (
    <div
      role="status"
      className={`border-b px-4 py-1.5 text-[11px] flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 ${tone}`}
    >
      {critical ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Gauge className="w-3.5 h-3.5 shrink-0" />}
      {sports.issue && <span className="font-semibold">{sports.issue}</span>}
      <span className="tabular-nums" title="Az API-Sports napi kerete UTC éjfélkor áll vissza.">
        API-Sports: {sportsUsed}/{sports.limit} felhasználva{sports.exact ? '' : ' (becslés)'}, 24 órán belül ezen az eszközön{' '}
        {sports.used24h} hívás, visszaáll {formatResetIn(sports.resetsAt, now)} múlva
      </span>
      <span
        className="tabular-nums"
        title="A The Odds API ingyenes csomagja havi 500 kredit; egy liga lekérése 2 kredit. A szám a szolgáltató válaszából származik, az összes eszköz és lekérés használatát tartalmazza."
      >
        The Odds API:{' '}
        {odds.remaining === null
          ? `${odds.limit} kredit/hó, még nem mértük`
          : `${odds.remaining} kredit maradt a ${odds.limit}-ból${odds.used !== null ? ` (${odds.used} felhasználva)` : ''}`}
        {odds.remaining !== null && oddsLevel === 'critical' ? ', a lekérések leálltak' : ''}
        {`, ma ${odds.fetchesToday}/${odds.dailyBudget} liga ezen az eszközön`}
      </span>
    </div>
  );
};
