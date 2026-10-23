import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { isPinEnabled, setupPin, changePin, disablePin, isValidPinFormat } from '../../services/pinService';

type PinFormMode = 'idle' | 'setup' | 'change' | 'disable';

const PIN_INPUT_BASE =
  'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none font-mono tracking-widest text-center';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  focusClass?: string;
  autoFocus?: boolean;
}

/** 6 számjegyű PIN beviteli mező (csak számjegyek, legfeljebb 6 karakter). */
const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  placeholder,
  show,
  focusClass = 'focus:border-amber-500',
  autoFocus,
}) => (
  <input
    type={show ? 'text' : 'password'}
    inputMode="numeric"
    maxLength={6}
    value={value}
    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    placeholder={placeholder}
    className={`${PIN_INPUT_BASE} ${focusClass}`}
    autoFocus={autoFocus}
  />
);

const ShowToggle: React.FC<{ show: boolean; onToggle: () => void }> = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
  >
    {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
    <span>{show ? 'Elrejtés' : 'Megjelenítés'}</span>
  </button>
);

const FormButtons: React.FC<{ onCancel: () => void; submitLabel: string; submitClass: string }> = ({
  onCancel,
  submitLabel,
  submitClass,
}) => (
  <div className="flex items-center justify-end gap-2 pt-1">
    <button
      type="button"
      onClick={onCancel}
      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
    >
      Mégse
    </button>
    <button
      type="submit"
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${submitClass}`}
    >
      {submitLabel}
    </button>
  </div>
);

/** A Beállítások PIN-képernyőzár szakasza: bekapcsolás, módosítás, kikapcsolás. */
export const PinSettingsSection: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const [pinActive, setPinActive] = useState<boolean>(() => isPinEnabled());
  const [pinFormMode, setPinFormMode] = useState<PinFormMode>('idle');
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccessNotice, setPinSuccessNotice] = useState<string | null>(null);
  const [showPinText, setShowPinText] = useState<boolean>(false);

  // PIN állapot frissítése ha kívülről vagy módosításkor változik
  useEffect(() => {
    setPinActive(isPinEnabled());
  }, [isOpen]);

  useEffect(() => {
    if (pinSuccessNotice) {
      const timer = setTimeout(() => setPinSuccessNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pinSuccessNotice]);

  const resetPinForm = () => {
    setPinFormMode('idle');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError(null);
    setShowPinText(false);
  };

  const openForm = (mode: PinFormMode) => {
    resetPinForm();
    setPinFormMode(mode);
  };

  const toggleShow = () => setShowPinText((prev) => !prev);

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!isValidPinFormat(newPinInput)) {
      setPinError('A PIN kódnak pontosan 6 számjegyből kell állnia!');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('A megadott két új PIN kód nem egyezik!');
      return;
    }

    const res = await setupPin(newPinInput);
    if (res.success) {
      setPinActive(true);
      setPinSuccessNotice('A 6-jegyű PIN védelem sikeresen bekapcsolva!');
      resetPinForm();
    } else {
      setPinError(res.error || 'Hiba a PIN mentésekor.');
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!isValidPinFormat(currentPinInput)) {
      setPinError('A jelenlegi PIN kódnak 6 számjegynek kell lennie!');
      return;
    }

    if (!isValidPinFormat(newPinInput)) {
      setPinError('Az új PIN kódnak pontosan 6 számjegyből kell állnia!');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('A megadott két új PIN kód nem egyezik!');
      return;
    }

    const res = await changePin(currentPinInput, newPinInput);
    if (res.success) {
      setPinSuccessNotice('A PIN kód sikeresen megváltoztatva!');
      resetPinForm();
    } else {
      setPinError(res.error || 'A jelenlegi PIN kód helytelen!');
    }
  };

  const handleDisablePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!isValidPinFormat(currentPinInput)) {
      setPinError('Add meg a jelenlegi 6-jegyű PIN kódot a kikapcsoláshoz!');
      return;
    }

    const res = await disablePin(currentPinInput);
    if (res.success) {
      setPinActive(false);
      setPinSuccessNotice('A PIN védelem sikeresen kikapcsolva!');
      resetPinForm();
    } else {
      setPinError(res.error || 'A megadott PIN kód helytelen!');
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-gradient-to-b from-slate-900/90 to-[#0B1220] rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>6-jegyű PIN Kód &amp; Alkalmazás Zárolás</span>
        </div>
        {pinActive ? (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Képernyőzár Aktív
          </span>
        ) : (
          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-medium">
            Kikapcsolva
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Képernyőzár: elrejti a bankrollt, a szelvényeket és a stratégiát a mellettad ülők elől. Bekapcsoláskor oldalfrissítéskor és a fejléc lakat ikonjával azonnal zárolható. Nem titkosítja az eszközön tárolt adatokat, és a böngésző adataihoz hozzáférőt nem állítja meg.
      </p>

      {pinSuccessNotice && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pinSuccessNotice}</span>
        </div>
      )}

      {pinError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{pinError}</span>
        </div>
      )}

      {/* Inaktív nézet */}
      {pinFormMode === 'idle' && (
        <div className="pt-1">
          {!pinActive ? (
            <button
              type="button"
              onClick={() => openForm('setup')}
              className="w-full py-2 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>6-jegyű PIN Kód Beállítása és Bekapcsolása</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openForm('change')}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                PIN Módosítása
              </button>
              <button
                type="button"
                onClick={() => openForm('disable')}
                className="py-2 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                Kikapcsolás
              </button>
            </div>
          )}
        </div>
      )}

      {/* Új PIN Beállítása Form */}
      {pinFormMode === 'setup' && (
        <form onSubmit={handleSetupPin} className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Új 6-jegyű PIN megadása</span>
            <ShowToggle show={showPinText} onToggle={toggleShow} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <PinInput value={newPinInput} onChange={setNewPinInput} placeholder="Új 6-jegyű PIN..." show={showPinText} autoFocus />
            <PinInput value={confirmPinInput} onChange={setConfirmPinInput} placeholder="PIN megerősítése..." show={showPinText} />
          </div>

          <FormButtons onCancel={resetPinForm} submitLabel="PIN Bekapcsolása" submitClass="bg-emerald-600 hover:bg-emerald-500 text-white" />
        </form>
      )}

      {/* PIN Módosítása Form */}
      {pinFormMode === 'change' && (
        <form onSubmit={handleChangePin} className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>PIN Kód Módosítása</span>
            <ShowToggle show={showPinText} onToggle={toggleShow} />
          </div>

          <PinInput value={currentPinInput} onChange={setCurrentPinInput} placeholder="Jelenlegi 6-jegyű PIN..." show={showPinText} autoFocus />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <PinInput value={newPinInput} onChange={setNewPinInput} placeholder="Új 6-jegyű PIN..." show={showPinText} />
            <PinInput value={confirmPinInput} onChange={setConfirmPinInput} placeholder="Új PIN megerősítése..." show={showPinText} />
          </div>

          <FormButtons onCancel={resetPinForm} submitLabel="Módosítás Mentése" submitClass="bg-amber-500 hover:bg-amber-400 text-slate-950" />
        </form>
      )}

      {/* PIN Kikapcsolása Form */}
      {pinFormMode === 'disable' && (
        <form onSubmit={handleDisablePin} className="space-y-2.5 pt-1">
          <div className="text-xs font-bold text-slate-300">PIN Védelem Kikapcsolása</div>
          <p className="text-[11px] text-slate-400">
            A védelem feloldásához és kikapcsolásához add meg a jelenlegi 6-jegyű PIN kódodat:
          </p>

          <PinInput
            value={currentPinInput}
            onChange={setCurrentPinInput}
            placeholder="Jelenlegi 6-jegyű PIN..."
            show={showPinText}
            focusClass="focus:border-rose-500"
            autoFocus
          />

          <FormButtons onCancel={resetPinForm} submitLabel="Kikapcsolás Megerősítése" submitClass="bg-rose-600 hover:bg-rose-500 text-white" />
        </form>
      )}
    </div>
  );
};
