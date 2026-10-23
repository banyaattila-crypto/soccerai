import React, { useState, useEffect, useMemo } from 'react';
import { Match, TrackedBet, TrackedBetStatus, BankrollSummary } from '../types/football';
import { EquityCurve } from './EquityCurve';
import { TrackedBetCard } from './bankroll/TrackedBetCard';
import { ManualBetModal } from './bankroll/ManualBetModal';
import {
  getTrackedBets,
  getInitialBankroll,
  setInitialBankroll,
  updateTrackedBetStatus,
  deleteTrackedBet,
  clearAllTrackedBets,
  autoEvaluateBetsWithMatches,
  calculateBankrollSummary,
  exportBetsToJson,
  importBetsFromJson,
} from '../services/bankrollService';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Ticket,
  Percent,
} from 'lucide-react';

interface BankrollViewProps {
  matches: Match[];
  onOpenBetSlip: () => void;
  onGoToGrid: () => void;
}

export const BankrollView: React.FC<BankrollViewProps> = ({
  matches,
  onOpenBetSlip,
  onGoToGrid,
}) => {
  const [bets, setBets] = useState<TrackedBet[]>([]);
  const [initialCapital, setInitialCapital] = useState<number>(50000);
  const [statusFilter, setStatusFilter] = useState<TrackedBetStatus | 'ALL'>('ALL');
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [tempCapital, setTempCapital] = useState<string>('50000');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Kézi szelvény hozzáadása modal állapota
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Adatok betöltése
  const refreshData = () => {
    const loadedBets = getTrackedBets();
    const loadedCapital = getInitialBankroll();
    setBets(loadedBets);
    setInitialCapital(loadedCapital);
    setTempCapital(loadedCapital.toString());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Értesítés eltüntetése 4 másodperc után
  useEffect(() => {
    if (noticeMessage) {
      const t = setTimeout(() => setNoticeMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [noticeMessage]);

  // Statisztikai összegzés
  const summary: BankrollSummary = useMemo(() => {
    return calculateBankrollSummary(bets, initialCapital);
  }, [bets, initialCapital]);

  // Szűrt szelvények
  const filteredBets = useMemo(() => {
    if (statusFilter === 'ALL') return bets;
    return bets.filter((b) => b.status === statusFilter);
  }, [bets, statusFilter]);

  // Kezdőtőke mentése
  const handleSaveCapital = () => {
    const parsed = parseInt(tempCapital, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setInitialBankroll(parsed);
      setInitialCapital(parsed);
      setIsEditingCapital(false);
      setNoticeMessage(`Kezdőtőke sikeresen frissítve: ${parsed.toLocaleString('hu-HU')} Ft`);
    }
  };

  // Státusz módosítása egy szelvényen
  const handleStatusChange = (betId: string, newStatus: TrackedBetStatus) => {
    const updated = updateTrackedBetStatus(betId, newStatus);
    setBets(updated);
    const statusLabel =
      newStatus === 'WON'
        ? 'Nyertesnek'
        : newStatus === 'LOST'
        ? 'Vesztesnek'
        : newStatus === 'VOID'
        ? 'Visszajártnak'
        : 'Függőben lévőnek';
    setNoticeMessage(`Szelvény státusza ${statusLabel} jelölve.`);
  };

  // Szelvény törlése
  const handleDeleteBet = (betId: string) => {
    if (window.confirm('Biztosan törlöd ezt a szelvényt a tétnaplóból?')) {
      const updated = deleteTrackedBet(betId);
      setBets(updated);
      setNoticeMessage('Szelvény sikeresen törölve.');
    }
  };

  // Automatikus kiértékelés
  const handleAutoEvaluate = () => {
    const result = autoEvaluateBetsWithMatches(matches);
    setBets(result.bets);
    if (result.updatedCount > 0) {
      setNoticeMessage(
        `🎉 ${result.updatedCount} db függőben lévő szelvény automatikusan kiértékelve a befejezett meccsek alapján!`
      );
    } else {
      setNoticeMessage('Nincs automatikusan lezárható szelvény a jelenlegi mérkőzések között.');
    }
  };

  // Teljes törlés
  const handleClearAll = () => {
    if (window.confirm('Biztosan kiüríted a teljes tétnaplót? A művelet nem visszavonható.')) {
      clearAllTrackedBets();
      setBets([]);
      setNoticeMessage('A teljes tétnapló kiürítve.');
    }
  };

  // Exportálás JSON-be
  const handleExportJson = () => {
    const jsonStr = exportBetsToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soccerai-bankroll-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNoticeMessage('Tétnapló sikeresen exportálva JSON fájlba!');
  };

  // Importálás JSON-ből
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = importBetsFromJson(content);
      if (success) {
        refreshData();
        setNoticeMessage('Tétnapló és bankroll sikeresen importálva!');
      } else {
        alert('Érvénytelen JSON fájlformátum!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Értesítési sáv */}
      {noticeMessage && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="btn-link text-amber-400/80 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Fejléc & Bevezető */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Wallet className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Saját Bankroll &amp; Tétnapló
            </h1>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              v1.7 PRO
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Fegyelmezett tőkeallokáció, automatikus szelvény-kiértékelés, valós idejű ROI számítás és Negyed-Kelly tétfegyelem a hosszú távú profitabilitásért.
          </p>
        </div>

        {/* Gyors navigációs gombok */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBetSlip}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>Szelvényépítő</span>
          </button>
          <button
            onClick={onGoToGrid}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <span>Mérkőzés Kínálat</span>
          </button>
        </div>
      </div>

      {/* 3. Összesítő KPI Kártyarács (5 kártya) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Kártya 1: Aktuális Bankroll */}
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 shadow-xl relative group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Aktuális Bankroll
            </span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>

          {isEditingCapital ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={tempCapital}
                onChange={(e) => setTempCapital(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-slate-950 border border-amber-400 rounded text-white font-mono"
                autoFocus
              />
              <button
                onClick={handleSaveCapital}
                className="p-1.5 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                title="Mentés"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingCapital(false)}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                title="Mégse"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {summary.currentBankroll.toLocaleString('hu-HU')} Ft
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>Kezdő: {initialCapital.toLocaleString('hu-HU')} Ft</span>
                <button
                  onClick={() => setIsEditingCapital(true)}
                  className="text-amber-400 hover:text-amber-300 opacity-80 hover:opacity-100 flex items-center gap-0.5 cursor-pointer"
                  title="Kezdőtőke átírása"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Átírás</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kártya 2: Nettó Profit */}
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Nettó Profit
            </span>
            <TrendingUp
              className={`w-4 h-4 ${
                summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {summary.netProfit >= 0 ? '+' : ''}
            {summary.netProfit.toLocaleString('hu-HU')} Ft
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Realizált kifizetésekből
          </div>
        </div>

        {/* Kártya 3: Saját ROI */}
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Saját ROI %
            </span>
            <Percent className="w-4 h-4 text-cyan-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              summary.roiPct >= 0 ? 'text-cyan-400' : 'text-red-400'
            }`}
          >
            {summary.roiPct >= 0 ? '+' : ''}
            {summary.roiPct}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {summary.totalStaked.toLocaleString('hu-HU')} Ft teljes tétből
          </div>
        </div>

        {/* Kártya 4: Találati Arány */}
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Találati Arány
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {summary.winRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {summary.wonBets} nyertes / {summary.wonBets + summary.lostBets} lezárt
          </div>
        </div>

        {/* Kártya 5: Függőben / Játékban */}
        <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800/80 shadow-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Lekötött Tét (Függőben)
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            {(
              bets.filter((b) => b.status === 'PENDING').reduce((a, c) => a + c.stake, 0)
            ).toLocaleString('hu-HU')}{' '}
            Ft
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {summary.pendingBets} db aktív szelvény
          </div>
        </div>
      </div>

      {/* 3b. Tőkegörbe és drawdown */}
      <EquityCurve bets={bets} initialBankroll={initialCapital} />

      {/* 4. Műveleti és Szűrősáv */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-mesh-card border border-slate-800">
        {/* Bal oldal: Státusz szűrőfülek */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { key: 'ALL', label: 'Összes szelvény', count: bets.length },
              { key: 'PENDING', label: 'Függőben', count: summary.pendingBets },
              { key: 'WON', label: 'Nyertes', count: summary.wonBets },
              { key: 'LOST', label: 'Vesztes', count: summary.lostBets },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Jobb oldal: Műveletek (Auto kiértékelés, Új szelvény, Export/Import, Reset) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Automatikus kiértékelés */}
          <button
            onClick={handleAutoEvaluate}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Szelvények összevetése a befejezett meccsekkel és azonnali kiértékelés"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Kiértékelés</span>
          </button>

          {/* Új szelvény kézzel */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Kézi Tét</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Tétnapló mentése JSON formátumban"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import JSON */}
          <label
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Tétnapló betöltése JSON fájlból"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Teljes törlés */}
          {bets.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
              title="Összes szelvény törlése"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Szelvény Kártyák Listája */}
      <div className="space-y-4">
        {filteredBets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-mesh-card border border-slate-800/60 space-y-3">
            <Ticket className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">Nincs megjeleníthető szelvény</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ebben a szűrőben jelenleg nincsenek szelvények. Rögzíts egy új tippet a Szelvényépítőben, vagy vegyél fel egy tétet kézzel.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                Tét kézi rögzítése
              </button>
              <button
                onClick={onOpenBetSlip}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer"
              >
                Irány a Szelvényépítő
              </button>
            </div>
          </div>
        ) : (
          filteredBets.map((bet) => (
            <TrackedBetCard key={bet.id} bet={bet} onStatusChange={handleStatusChange} onDelete={handleDeleteBet} />
          ))
        )}
      </div>

      {/* 6. Kézi Tét Rögzítése Modal */}
      {isManualModalOpen && (
        <ManualBetModal
          onClose={() => setIsManualModalOpen(false)}
          onSaved={() => {
            refreshData();
            setIsManualModalOpen(false);
            setNoticeMessage('Új szelvény sikeresen rögzítve a tétnaplóban!');
          }}
        />
      )}
    </div>
  );
};
