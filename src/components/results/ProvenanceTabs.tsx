import React from 'react';
import { ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import type { ProvenanceViewTab } from '../ResultsView';

interface ProvenanceTabsProps {
  active: ProvenanceViewTab;
  onChange: (tab: ProvenanceViewTab) => void;
  counts: { all: number; verified: number; unverified: number };
}

const TABS: {
  id: ProvenanceViewTab;
  label: string;
  Icon: typeof Layers;
  activeClass: string;
  count: (c: ProvenanceTabsProps['counts']) => number;
}[] = [
  { id: 'all', label: 'Összes Befejezett Eredmény', Icon: Layers, activeClass: 'border-blue-500 text-blue-400', count: (c) => c.all },
  {
    id: 'verified',
    label: 'Hitelesített Pre-Match Napló',
    Icon: ShieldCheck,
    activeClass: 'border-brand-500 text-brand-400',
    count: (c) => c.verified,
  },
  {
    id: 'unverified',
    label: 'Nem auditált külső archívum',
    Icon: AlertTriangle,
    activeClass: 'border-amber-500 text-amber-400',
    count: (c) => c.unverified,
  },
];

/** Fülválasztó: összes eredmény, hitelesített audit napló, nem auditált külső archívum. */
export const ProvenanceTabs: React.FC<ProvenanceTabsProps> = ({ active, onChange, counts }) => (
  <div className="flex flex-wrap border-b border-slate-800 gap-2 pt-2">
    {TABS.map(({ id, label, Icon, activeClass, count }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
          active === id ? activeClass : 'border-transparent text-slate-400 hover:text-slate-200'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>
          {label} ({count(counts)})
        </span>
      </button>
    ))}
  </div>
);
