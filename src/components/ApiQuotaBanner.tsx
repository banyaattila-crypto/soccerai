import React, { useEffect, useState } from 'react';
import { AlertTriangle, Gauge } from 'lucide-react';
import { getApiSportsUsage, type ApiSportsUsage } from '../services/quotaService';

function formatResetIn(resetsAt: number, nowMs: number): string {
  const mins = Math.max(0, Math.round((resetsAt - nowMs) / 60000));
  return `${Math.floor(mins / 60)} ó ${mins % 60} p`;
}

/**
 * Az API-Sports napi keretének kijelzése és a fiókhiba (pl. felfüggesztés) látható jelzése.
 * Hiba nélkül csak akkor jelenik meg, ha a keret 30% alá csökkent, hogy ne zavarjon.
 */
export const ApiQuotaBanner: React.FC = () => {
  const [usage, setUsage] = useState<ApiSportsUsage>(() => getApiSportsUsage());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => {
      setUsage(getApiSportsUsage());
      setNow(Date.now());
    };
    const id = window.setInterval(tick, 15000);
    window.addEventListener('storage', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', tick);
    };
  }, []);

  const low = usage.remaining <= usage.limit * 0.3;
  if (!usage.issue && !low) return null;

  const used = usage.limit - usage.remaining;
  return (
    <div
      role="status"
      className={`border-b px-4 py-2 text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${
        usage.issue
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}
    >
      {usage.issue ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Gauge className="w-4 h-4 shrink-0" />}
      {usage.issue && <span className="font-semibold">{usage.issue}</span>}
      <span className="tabular-nums">
        API-Sports kereret: {used}/{usage.limit} felhasználva{usage.exact ? '' : ' (becslés)'}; ebből ebben a böngészőben 24 órán belül{' '}
        {usage.used24h} hívás. Visszaáll: {formatResetIn(usage.resetsAt, now)} múlva (UTC éjfél).
      </span>
    </div>
  );
};
