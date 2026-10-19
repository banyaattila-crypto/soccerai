import React, { useState, useEffect } from 'react';
import { X, Server, Key, Check, ArrowLeft } from 'lucide-react';
import { APP_VERSION } from '../version';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onSaveConfig?: (source: 'builtin' | 'api', key: string, apiSportsKey?: string, enableSecondary?: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAbout, onSaveConfig }) => {
  const [dataSource, setDataSource] = useState<'builtin' | 'api'>(() => {
    return (localStorage.getItem('focitipp_datasource') as 'builtin' | 'api') || 'api';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apikey') || '';
  });
  const [apiSportsKey, setApiSportsKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apisports_key') || '';
  });
  const [enableSecondaryLeagues, setEnableSecondaryLeagues] = useState<boolean>(() => {
    return localStorage.getItem('focitipp_enable_secondary') !== 'false';
  });
  const [threshold, setThreshold] = useState<number>(() => {
    return parseInt(localStorage.getItem('focitipp_threshold') || '60', 10);
  });
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('focitipp_datasource', dataSource);
    localStorage.setItem('focitipp_apikey', apiKey);
    localStorage.setItem('focitipp_apisports_key', apiSportsKey);
    localStorage.setItem('focitipp_enable_secondary', enableSecondaryLeagues ? 'true' : 'false');
    localStorage.setItem('focitipp_threshold', threshold.toString());
    window.dispatchEvent(new Event('focitipp_settings_updated'));
    setSaved(true);
    if (onSaveConfig) {
      onSaveConfig(dataSource, apiKey, apiSportsKey, enableSecondaryLeagues);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-mesh-modal border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Fejléc */}
        <div className="p-4 sm:p-5 bg-mesh-header border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors mr-1 cursor-pointer"
              title="Vissza a főoldalra"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Vissza</span>
            </button>
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm sm:text-base">Rendszer &amp; API Beállítások</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test tartalom - Garantáltan gördíthető */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          
          {/* Adatforrás választó */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Adatforrás & Szimulációs Mód
            </label>

            <div className="space-y-2">
              <label
                onClick={() => setDataSource('api')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  dataSource === 'api'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="datasource"
                  checked={dataSource === 'api'}
                  onChange={() => setDataSource('api')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>Élő Külső Futball API (Football-Data.org)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      Aktív / Éles kulccsal
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Közvetlen élő mérkőzés szinkronizáció valós mai párosításokkal, állásokkal és logókkal.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDataSource('builtin')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  dataSource === 'builtin'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="datasource"
                  checked={dataSource === 'builtin'}
                  onChange={() => setDataSource('builtin')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>Beépített Offline Szimulációs Motor</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-medium">
                      Offline Demó
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Előre definiált minta rangadók és tesztadatok (internetkapcsolattól és API rátakorlátoktól független).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* API Kulcs mező */}
          <div className="space-y-2 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Football-Data.org API Kulcs</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {apiKey ? '✓ Egyéni kulcs megadva' : '✓ Szerveroldali proxy aktív'}
              </span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Üresen hagyva a szerveroldali környezeti változót használja..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[10px] text-slate-500">
              A kulcsot a biztonságos szerveroldali proxy (<code className="text-slate-300">FOOTBALL_DATA_API_KEY</code>) kezeli.
            </p>
          </div>

          {/* Másodosztályok & API-Sports Beállítások */}
          <div className="space-y-3 p-3.5 bg-gradient-to-b from-slate-900/90 to-[#0B1220] rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>API-Sports, Nemzetközi Kupák &amp; Bajnokságok</span>
              </label>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold font-mono">
                {apiSportsKey ? '✓ Egyéni kulcs' : '✓ Proxy védett (100 req/nap)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Nemzetközi kupák &amp; további ligák bekapcsolása</div>
                <div className="text-[10px] text-slate-400">
                  Bajnokok Ligája (UCL), Európa Liga (UEL), Konferencia Liga (UECL), NB I, Primeira Liga, Süper Lig, Jupiler Pro, MLS és másodosztályok.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSecondaryLeagues}
                  onChange={(e) => setEnableSecondaryLeagues(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                API-Sports Kulcs (opcionális felülbírálat)
              </label>
              <input
                type="password"
                value={apiSportsKey}
                onChange={(e) => setApiSportsKey(e.target.value)}
                placeholder="Üresen hagyva a szerveroldali API_SPORTS_KEY változót használja..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Szerveroldali proxy (<code className="text-slate-300">API_SPORTS_KEY</code>) és 45 perces gyorsítótár védi a kvótát.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">⭐ Bajnokok Ligája</span>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">🏆 Európa Liga</span>
              <span className="text-[10px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">🟢 Konferencia Liga</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇭🇺 NB I</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇵🇹 Primeira Liga</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇪🇸 LaLiga 2</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇩🇪 2. Bundesliga</span>
            </div>
          </div>

          {/* Erős szignál küszöbérték */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="uppercase tracking-wider">Erős Szignál Küszöbérték</span>
              <span className="text-amber-400 font-mono font-black">{threshold}%+</span>
            </div>
            <input
              type="range"
              min="50"
              max="75"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>50% (Több tipp)</span>
              <span>60% (Kiegyensúlyozott)</span>
              <span>75% (Csak elit)</span>
            </div>
          </div>

          {/* Verzióinformáció & Névjegy gomb */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">SoccerAI PRO</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">
                v{APP_VERSION}
              </span>
            </div>
            {onOpenAbout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAbout();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Névjegy &amp; Release Notes</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>

        </div>

        {/* Lábléc gombok - Mindig rögzítve az ablak alján */}
        <div className="p-4 bg-mesh-header border-t border-slate-800 flex items-center justify-between shrink-0 gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vissza</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Mentve és Alkalmazva!
              </>
            ) : (
              'Beállítások Mentése'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
