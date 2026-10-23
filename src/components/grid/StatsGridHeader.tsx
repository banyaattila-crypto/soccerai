import React from 'react';
import type { DayFilter } from '../../types/football';

interface StatsGridHeaderProps {
  filteredCount: number;
  dayFilter: DayFilter;
  onDayFilterChange: (day: DayFilter) => void;
  countsByDay: { yesterday: number; today: number; tomorrow: number };
  /** Ha a mai napra nincs meccs, a "Ma" fül az összes betöltött meccs számát mutatja */
  totalMatches: number;
}

/** A Mérkőzés fül címe, találatszáma és a Tegnap / Ma / Holnap választó. */
export const StatsGridHeader: React.FC<StatsGridHeaderProps> = ({
  filteredCount,
  dayFilter,
  onDayFilterChange,
  countsByDay,
  totalMatches,
}) => {
  const tabs: { day: DayFilter; label: string; count: number }[] = [
    { day: 'yesterday', label: 'Tegnap', count: countsByDay.yesterday },
    { day: 'today', label: 'Ma', count: countsByDay.today > 0 ? countsByDay.today : totalMatches },
    { day: 'tomorrow', label: 'Holnap', count: countsByDay.tomorrow },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Statisztikai Esély Rács</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            {filteredCount} mérkőzés
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Válassz bajnokságot a fenti fülekkel, vagy kattints bármelyik mérkőzésre a részletes elemzéshez.
        </p>
      </div>

      {/* Dátumválasztó Tabok (Tegnap / Ma / Holnap) */}
      <div className="flex items-center gap-1 bg-mesh-dark p-1 rounded-xl border border-slate-800 self-start md:self-auto">
        {tabs.map((t) => (
          <button
            key={t.day}
            onClick={() => onDayFilterChange(t.day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dayFilter === t.day ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label} <span className="opacity-70 text-[10px]">({t.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
