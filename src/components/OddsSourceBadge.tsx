import React from 'react';

export type OddsSourceState = 'real' | 'expired' | 'simulated';

export function resolveOddsSourceState(opts: {
  isSimulated?: boolean;
  isExpired?: boolean;
}): OddsSourceState {
  if (opts.isExpired) return 'expired';
  if (opts.isSimulated !== false) return 'simulated';
  return 'real';
}

interface OddsSourceBadgeProps {
  state: OddsSourceState;
  bookmakerName?: string;
  ttlMinutes?: number;
}

/**
 * Egységes odds-forrás jelvény. A szimulált ár szándékosan szaggatott keretet kap,
 * hogy színvakon és kis méretben is elkülönüljön a valós bukmékeri ártól.
 */
export const OddsSourceBadge: React.FC<OddsSourceBadgeProps> = ({
  state,
  bookmakerName,
  ttlMinutes,
}) => {
  if (state === 'real') {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-blue-500/15 text-blue-200 border-blue-500/40 inline-flex items-center gap-1"
        title="Valós bukmékeri ár, érvényességi időn belül"
      >
        <span>{bookmakerName ? `Valós ár: ${bookmakerName}` : 'Valós ár'}</span>
        {ttlMinutes !== undefined && (
          <span className="text-[9px] text-blue-300 font-mono">{ttlMinutes} perc</span>
        )}
      </span>
    );
  }
  if (state === 'expired') {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-dotted bg-red-500/15 text-red-200 border-red-400/60"
        title="A bukmékeri ár érvényessége lejárt, frissítés szükséges"
      >
        Lejárt ár
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-dashed bg-amber-500/10 text-amber-200 border-amber-400/60"
      title="A modell saját valószínűségéből képzett ár, nem bukmékeri kínálat: nem fogadható"
    >
      Szimulált ár
    </span>
  );
};

interface OddsSourceRibbonProps {
  state: OddsSourceState;
}

/** Csíkozott sáv a kártya tetején szimulált vagy lejárt ár esetén. */
export const OddsSourceRibbon: React.FC<OddsSourceRibbonProps> = ({ state }) => {
  if (state === 'real') return null;
  const isExpired = state === 'expired';
  const rgb = isExpired ? '248,113,113' : '245,158,11';
  return (
    <div
      role="note"
      className={`h-5 flex items-center justify-center text-[10px] font-extrabold tracking-wider ${
        isExpired ? 'text-red-200' : 'text-amber-200'
      }`}
      style={{
        backgroundImage: `repeating-linear-gradient(135deg, rgba(${rgb},0.18) 0 8px, rgba(${rgb},0.06) 8px 16px)`,
      }}
    >
      {isExpired ? 'LEJÁRT ÁR · FRISSÍTÉS SZÜKSÉGES' : 'SZIMULÁLT ÁR · NEM FOGADHATÓ'}
    </div>
  );
};
