import type { Match, PredictionAuditRecord } from '../types/football';
import { sha256Hex } from '../utils/sha256';
import { getClvStats, marketSnapshotForPick, type ClvStats } from './clvService';

/**
 * Fogadási protokoll: előre rögzített, verziózott szabály arra, hogy melyik naplózott tipp számít "protokoll-tippnek".
 *
 * Miért: a tippek utólagos válogatása (csak a nyerteket nézzük, a küszöböt az eredményhez igazítjuk) mindig
 * pozitív képet fest. A protokoll fixálja a szabályt a mérés ELŐTT, a verzió és az ujjlenyomat minden új rekordra
 * rákerül, a szabály módosítása új verziót (új statisztikát) jelent, a régi eredmény nem íródik át. A protokoll-tippek
 * papíron (fix 1 egységes téttel) követhetők; az "éles fogadásra alkalmas" jelzést csak a kapu (lásd gateFor) adja.
 */

export interface ProtocolConfig {
  /** 'edge': ár-előny alapú protokoll (A); 'prob': magas valószínűségű tippek (B) */
  id: 'edge' | 'prob';
  version: number;
  /** Legkisebb piaci (de-vigelt) valószínűség, % (0: nincs korlát) */
  minProbPct: number;
  /** Csak ezek a tipp-piacok számítanak (1X2 és Over/Under 2.5: ezekre van piaci referencia) */
  markets: string[];
  /** Legkisebb ár-előny a piaci konszenzus fair árához képest, % (szorzó · fair − 1) */
  minEdgePct: number;
  /** Ennél nagyobb "előny" valószínűleg elavult vagy hibás ár, nem valódi érték, % */
  maxEdgePct: number;
  /** Modell–piac eltérés felső határa, százalékpont (docs/backtest-disagreement.md: fölötte a piac pontosabb) */
  maxGapPp: number;
  /** Ettől az eltéréstől a tipp "erős eltérés" (kizárt), a köztes sáv "figyelmeztetés" */
  strongGapPp: number;
  minOdds: number;
  maxOdds: number;
  /** Naplózás és kezdés között legalább ennyi idő kell ahhoz, hogy a tipp megfogadható legyen, ms */
  minLeadMs: number;
  /** Naponta (kezdési nap szerint) legfeljebb ennyi protokoll-tipp, a naplózás sorrendjében */
  maxPerDay: number;
  /** Papírkereskedés téte, egység */
  stakeUnits: number;
  /** Az éles kapu küszöbei */
  gate: { minSettled: number; minClvSamples: number; minRoiPct: number };
}

export const PROTOCOL_V1: ProtocolConfig = {
  id: 'edge',
  version: 1,
  minProbPct: 0,
  markets: ['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN', 'OVER_25', 'UNDER_25'],
  minEdgePct: 2,
  maxEdgePct: 20,
  maxGapPp: 5,
  strongGapPp: 12,
  minOdds: 1.5,
  maxOdds: 4,
  minLeadMs: 20 * 60 * 1000,
  maxPerDay: 5,
  stakeUnits: 1,
  gate: { minSettled: 100, minClvSamples: 100, minRoiPct: 0 },
};

/**
 * B protokoll: magas valószínűségű tippek. A cél a nagy találati arány olyan áron, ami nem rosszabb a fair árnál:
 * piaci valószínűség legalább 70%, szorzó 1,25-1,70, a legjobb ár legalább a fair ár (EV >= 0), eltérés legfeljebb 5 pp.
 * A nagy valószínűség önmagában nem jövedelmező (az árrés miatt), ezért az ár feltétele kötelező.
 */
export const PROTOCOL_PROB_V1: ProtocolConfig = {
  id: 'prob',
  version: 1,
  minProbPct: 70,
  markets: ['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN', 'OVER_25', 'UNDER_25'],
  minEdgePct: 0,
  maxEdgePct: 20,
  maxGapPp: 5,
  strongGapPp: 12,
  minOdds: 1.25,
  maxOdds: 1.7,
  minLeadMs: 20 * 60 * 1000,
  maxPerDay: 5,
  stakeUnits: 1,
  gate: { minSettled: 100, minClvSamples: 100, minRoiPct: 0 },
};

export const ACTIVE_PROTOCOL = PROTOCOL_V1;

/** A szabály ujjlenyomata: bármely küszöb módosítása más értéket ad, ezért a verzióhoz kötött eredmény ellenőrizhető. */
export function protocolFingerprint(cfg: ProtocolConfig = ACTIVE_PROTOCOL): string {
  // Az A protokoll v1 ujjlenyomata a B bevezetése előtt rögzített rekordokon is érvényes marad: az `id` és a
  // semleges (0) `minProbPct` mezők a szabályt nem változtatják, ezért nem kerülnek az ujjlenyomatba.
  const { id, minProbPct, ...legacy } = cfg;
  const payload = id === 'edge' && minProbPct === 0 ? legacy : cfg;
  return `proto-${sha256Hex(canonicalJson(payload)).slice(0, 16)}`;
}

/** Rendezett kulcsú, beágyazással együtt egyértelmű JSON (a tömb-szűrős JSON.stringify a beágyazott kulcsokat eldobná). */
function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

export interface ProtocolInput {
  market: string;
  odds: number;
  isSimulatedOdds: boolean;
  /** A tipp kimenetelének de-vigelt piaci (fair) valószínűsége, % (a naplózáskori pillanatképből) */
  fairProbPct?: number;
  /** Modell–piac eltérés, százalékpont; null, ha nem ismert */
  gapPp: number | null;
  leadMs: number;
}

export type ProtocolLevel = 'eligible' | 'warn' | 'excluded';

export interface ProtocolEvaluation {
  eligible: boolean;
  /** 'warn': az eltérés a figyelmeztető sávban van; 'excluded': erős eltérés vagy más kizáró ok */
  level: ProtocolLevel;
  /** Ár-előny a piaci konszenzushoz, % (ha számolható) */
  edgePct?: number;
  /** A kizáró okok, magyarul */
  reasons: string[];
}

/** A tipp megfelel-e a protokollnak. Tiszta függvény; a napi keretet (maxPerDay) a selectProtocolRecords alkalmazza. */
export function evaluateProtocolInput(input: ProtocolInput, cfg: ProtocolConfig = ACTIVE_PROTOCOL): ProtocolEvaluation {
  const reasons: string[] = [];
  let level: ProtocolLevel = 'eligible';

  if (!cfg.markets.includes(input.market)) reasons.push('A piac nem szerepel a protokollban.');
  if (input.isSimulatedOdds) reasons.push('Szimulált szorzó: nincs valós piaci ár.');
  if (!(input.odds >= cfg.minOdds && input.odds <= cfg.maxOdds)) {
    reasons.push(`A szorzó a ${cfg.minOdds.toFixed(2)}–${cfg.maxOdds.toFixed(2)} sávon kívül van.`);
  }
  if (input.leadMs < cfg.minLeadMs) {
    reasons.push(`A naplózás és a kezdés között kevesebb mint ${Math.round(cfg.minLeadMs / 60000)} perc volt.`);
  }

  let edgePct: number | undefined;
  if (input.fairProbPct === undefined || !(input.fairProbPct > 0)) {
    reasons.push('Nincs piaci referencia (fair ár) a naplózáskor.');
  } else {
    if (cfg.minProbPct > 0 && input.fairProbPct < cfg.minProbPct) {
      reasons.push(`A piaci valószínűség (${input.fairProbPct.toFixed(1)}%) a ${cfg.minProbPct}% küszöb alatt van.`);
    }
    edgePct = (input.odds * (input.fairProbPct / 100) - 1) * 100;
    if (edgePct < cfg.minEdgePct) {
      reasons.push(`Az ár-előny (${edgePct.toFixed(1)}%) a ${cfg.minEdgePct}% küszöb alatt van.`);
    } else if (edgePct > cfg.maxEdgePct) {
      reasons.push(`Az ár-előny (${edgePct.toFixed(1)}%) gyanúsan nagy: elavult vagy hibás ár lehet.`);
    }
  }

  if (input.gapPp === null || !isFinite(input.gapPp)) {
    reasons.push('A modell–piac eltérés nem ismert.');
  } else if (input.gapPp >= cfg.strongGapPp) {
    reasons.push(`Erős modell–piac eltérés (${input.gapPp.toFixed(1)} pp): ilyenkor a piac pontosabb.`);
    level = 'excluded';
  } else if (input.gapPp > cfg.maxGapPp) {
    reasons.push(`Figyelmeztető modell–piac eltérés (${input.gapPp.toFixed(1)} pp > ${cfg.maxGapPp} pp).`);
    level = 'warn';
  }

  if (reasons.length === 0) return { eligible: true, level: 'eligible', edgePct, reasons };
  return { eligible: false, level: level === 'warn' ? 'warn' : 'excluded', edgePct, reasons };
}

const THREE_WAY = new Set(['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN']);

/**
 * A modell és a piac eltérése a tipp piacán, százalékpontban. 1X2 tippnél a három kimenetel közül a legnagyobb
 * eltérés (ez a backtest mértéke), Over/Under tippnél a 2.5 gólos valószínűség eltérése. Ismeretlen, ha a megjelenített
 * valószínűség nem piaci alapú (nincs valós szorzó).
 */
export function computePickGapPp(
  match: Pick<Match, 'probabilities' | 'modelProbabilities' | 'probabilitySource'>,
  market: string
): number | null {
  if (match.probabilitySource !== 'market' || !match.modelProbabilities) return null;
  const model = match.modelProbabilities;
  const mkt = match.probabilities;
  if (THREE_WAY.has(market)) {
    const d = Math.max(
      Math.abs(model.homeWin - mkt.homeWin),
      Math.abs(model.draw - mkt.draw),
      Math.abs(model.awayWin - mkt.awayWin)
    );
    return Math.round(d * 10) / 10;
  }
  if (market === 'OVER_25' || market === 'UNDER_25') {
    return Math.round(Math.abs(model.over25 - mkt.over25) * 10) / 10;
  }
  return null;
}

/** A naplózáskor a rekordra kerülő protokoll-bélyeg (nem része az auditHash-nek; a döntés belőle és a rekordból újraszámolható). */
export function protocolStamp(
  match: Pick<Match, 'probabilities' | 'modelProbabilities' | 'probabilitySource'>,
  market: string,
  cfg: ProtocolConfig = ACTIVE_PROTOCOL
): NonNullable<PredictionAuditRecord['protocol']> {
  return { version: cfg.version, fingerprint: protocolFingerprint(cfg), gapPp: computePickGapPp(match, market) };
}

/** Egy élő meccs tippjének protokoll-értékelése (a kártyák jelzéséhez); a napi keretet nem vizsgálja. */
export function evaluateMatchPick(
  match: Match,
  kickoffMs: number,
  nowMs: number = Date.now(),
  cfg: ProtocolConfig = ACTIVE_PROTOCOL
): ProtocolEvaluation | null {
  const pick = match.aiPick;
  if (!pick || isNaN(kickoffMs)) return null;
  const snapshot = pick.isSimulatedOdds === false ? marketSnapshotForPick(match, pick.market, nowMs) : undefined;
  return evaluateProtocolInput(
    {
      market: pick.market,
      odds: pick.odds,
      isSimulatedOdds: pick.isSimulatedOdds !== false,
      fairProbPct: snapshot?.fairProb,
      gapPp: computePickGapPp(match, pick.market),
      leadMs: kickoffMs - nowMs,
    },
    cfg
  );
}

/** Egy naplózott rekord értékelése a rögzített adataiból; más protokoll-verziójú vagy bélyeg nélküli rekord nem számít. */
export function evaluateRecord(record: PredictionAuditRecord, cfg: ProtocolConfig = ACTIVE_PROTOCOL): ProtocolEvaluation | null {
  if (record.provenance !== 'VERIFIED_PRE_MATCH') return null;
  if (!record.protocol || record.protocol.version !== cfg.version) return null;
  const logged = Date.parse(record.loggedAt);
  return evaluateProtocolInput(
    {
      market: record.pick.market,
      odds: record.pick.odds,
      isSimulatedOdds: record.pick.isSimulatedOdds !== false,
      fairProbPct: record.marketAtLog?.fairProb,
      gapPp: record.protocol.gapPp,
      leadMs: isNaN(logged) ? -Infinity : record.kickoffTimestamp - logged,
    },
    cfg
  );
}

/** A protokoll-tippek kiválasztása: a feltételeknek megfelelők közül naponta (kezdési nap) az első `maxPerDay` a naplózás sorrendjében. */
export function selectProtocolRecords(
  records: PredictionAuditRecord[],
  cfg: ProtocolConfig = ACTIVE_PROTOCOL
): PredictionAuditRecord[] {
  const eligible = records
    .filter((r) => evaluateRecord(r, cfg)?.eligible)
    .sort((a, b) => Date.parse(a.loggedAt) - Date.parse(b.loggedAt) || a.id.localeCompare(b.id));
  const perDay = new Map<string, number>();
  const out: PredictionAuditRecord[] = [];
  for (const r of eligible) {
    const used = perDay.get(r.kickoffDate) ?? 0;
    if (used >= cfg.maxPerDay) continue;
    perDay.set(r.kickoffDate, used + 1);
    out.push(r);
  }
  return out.sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp);
}

export interface GateCriterion {
  key: 'settled' | 'clv' | 'roi' | 'calibration';
  label: string;
  have: string;
  need: string;
  ok: boolean;
  /** 0..1 haladás a célhoz (csak a megjelenítéshez) */
  progress: number;
}

export type GateStatus = 'collecting' | 'paper' | 'ready' | 'stop';

export interface ProtocolStats {
  version: number;
  fingerprint: string;
  /** Protokoll-tippek (napi kerettel) */
  selected: number;
  pending: number;
  settled: number;
  won: number;
  winRatePct: number;
  /** Papír eredmény egységben (fix tét) */
  units: number;
  roiPct: number;
  roiCi95LowPct: number;
  roiCi95HighPct: number;
  /** A tippek átlagos ár-előnye a naplózáskor (a piaci konszenzushoz), % */
  avgEdgePct: number;
  maxDrawdownUnits: number;
  clv: ClvStats;
  gate: { status: GateStatus; criteria: GateCriterion[]; summary: string };
  /** Piaconként: 1X2 vs Over/Under */
  byMarket: { label: string; n: number; settled: number; roiPct: number }[];
  /** Kalibráció: a naplózáskori piaci valószínűség átlaga és a tényleges találati arány a lezárt tippeken */
  calibration: Calibration;
}

export interface Calibration {
  n: number;
  predictedPct: number;
  observedPct: number;
  /** (megfigyelt - becsült) / szórás; negatív: a tippek a becsültnél ritkábban nyertek */
  z: number;
}

/** A becsült (naplózáskori fair) valószínűségek és a tényleges találatok összevetése; a szórás a Bernoulli-összegből. */
export function calibrationOf(rows: { prob: number; won: boolean }[]): Calibration {
  const n = rows.length;
  if (n === 0) return { n: 0, predictedPct: 0, observedPct: 0, z: 0 };
  const pred = rows.reduce((a, r) => a + r.prob, 0) / n;
  const obs = rows.filter((r) => r.won).length / n;
  const variance = rows.reduce((a, r) => a + r.prob * (1 - r.prob), 0);
  const sd = Math.sqrt(variance) / n;
  return { n, predictedPct: pred * 100, observedPct: obs * 100, z: sd > 0 ? (obs - pred) / sd : 0 };
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function returnUnits(r: PredictionAuditRecord, stake: number): number | null {
  if (!r.settled) return null;
  if (r.status === 'WON') return (r.pick.odds - 1) * stake;
  if (r.status === 'LOST') return -stake;
  return null;
}

export function computeProtocolStats(
  records: PredictionAuditRecord[],
  cfg: ProtocolConfig = ACTIVE_PROTOCOL
): ProtocolStats {
  const selected = selectProtocolRecords(records, cfg);
  const settledRows = selected
    .map((r) => ({ r, u: returnUnits(r, cfg.stakeUnits) }))
    .filter((x): x is { r: PredictionAuditRecord; u: number } => x.u !== null);
  const n = settledRows.length;
  const units = settledRows.reduce((a, x) => a + x.u, 0);
  const perBet = settledRows.map((x) => (x.u / cfg.stakeUnits) * 100);
  const roi = mean(perBet);
  const variance = n > 1 ? perBet.reduce((a, b) => a + (b - roi) ** 2, 0) / (n - 1) : 0;
  const se = Math.sqrt(variance / Math.max(1, n));

  let peak = 0;
  let run = 0;
  let dd = 0;
  for (const x of settledRows) {
    run += x.u;
    peak = Math.max(peak, run);
    dd = Math.max(dd, peak - run);
  }

  const edges = selected
    .map((r) => (r.marketAtLog ? (r.pick.odds * (r.marketAtLog.fairProb / 100) - 1) * 100 : NaN))
    .filter((e) => isFinite(e));
  const clv = getClvStats(selected);

  const marketGroups: [string, (m: string) => boolean][] = [
    ['1X2', (m) => THREE_WAY.has(m)],
    ['Over/Under 2.5', (m) => m === 'OVER_25' || m === 'UNDER_25'],
  ];
  const byMarket = marketGroups.map(([label, test]) => {
    const rows = selected.filter((r) => test(r.pick.market));
    const sr = settledRows.filter((x) => test(x.r.pick.market));
    return { label, n: rows.length, settled: sr.length, roiPct: mean(sr.map((x) => (x.u / cfg.stakeUnits) * 100)) };
  });

  const roiLow = roi - 1.96 * se;
  const roiHigh = roi + 1.96 * se;
  const calibration = calibrationOf(
    settledRows
      .filter((x) => x.r.marketAtLog)
      .map((x) => ({ prob: (x.r.marketAtLog as { fairProb: number }).fairProb / 100, won: x.r.status === 'WON' }))
  );
  const gate = gateFor({ settled: n, clv, roiPct: roi, roiHigh, calibration }, cfg);

  return {
    version: cfg.version,
    fingerprint: protocolFingerprint(cfg),
    selected: selected.length,
    pending: selected.filter((r) => !r.settled).length,
    settled: n,
    won: settledRows.filter((x) => x.r.status === 'WON').length,
    winRatePct: n > 0 ? (settledRows.filter((x) => x.r.status === 'WON').length / n) * 100 : 0,
    units,
    roiPct: roi,
    roiCi95LowPct: roiLow,
    roiCi95HighPct: roiHigh,
    avgEdgePct: mean(edges),
    maxDrawdownUnits: dd,
    clv,
    gate,
    byMarket,
    calibration,
  };
}

/**
 * Az "éles fogadásra alkalmas" kapu. Mindhárom feltételnek egyszerre kell teljesülnie:
 *  1. legalább `minSettled` lezárt protokoll-tipp,
 *  2. legalább `minClvSamples` CLV-minta, és a CLV 95%-os intervallumának alsó széle pozitív (edge_likely),
 *  3. a papír ROI nem negatív.
 * Ha a CLV bizonyítottan negatív, vagy a ROI intervallumának felső széle is negatív (elég mintával), a státusz "stop".
 */
export function gateFor(
  m: { settled: number; clv: ClvStats; roiPct: number; roiHigh: number; calibration?: Calibration },
  cfg: ProtocolConfig = ACTIVE_PROTOCOL
): ProtocolStats['gate'] {
  if (cfg.id === 'prob') return gateForProb(m, cfg);
  const g = cfg.gate;
  const criteria: GateCriterion[] = [
    {
      key: 'settled',
      label: 'Lezárt protokoll-tippek',
      have: String(m.settled),
      need: `legalább ${g.minSettled}`,
      ok: m.settled >= g.minSettled,
      progress: Math.min(1, m.settled / g.minSettled),
    },
    {
      key: 'clv',
      label: 'Záró árhoz mért ár-előny (CLV)',
      have: m.clv.n > 0 ? `${m.clv.meanClvPct >= 0 ? '+' : ''}${m.clv.meanClvPct.toFixed(2)}%, n = ${m.clv.n}` : 'nincs adat',
      need: `n ≥ ${g.minClvSamples} és az intervallum alsó széle > 0`,
      ok: m.clv.n >= g.minClvSamples && m.clv.verdict === 'edge_likely',
      progress: Math.min(1, m.clv.n / g.minClvSamples),
    },
    {
      key: 'roi',
      label: 'Papír ROI',
      have: m.settled > 0 ? `${m.roiPct >= 0 ? '+' : ''}${m.roiPct.toFixed(1)}%` : 'nincs adat',
      need: `legalább ${g.minRoiPct}%`,
      ok: m.settled >= g.minSettled && m.roiPct >= g.minRoiPct,
      progress: m.settled >= g.minSettled ? (m.roiPct >= g.minRoiPct ? 1 : 0.5) : Math.min(1, m.settled / g.minSettled),
    },
  ];

  const stop =
    m.clv.verdict === 'negative' || (m.settled >= g.minSettled && m.roiHigh < g.minRoiPct);
  if (stop) {
    return {
      status: 'stop',
      criteria,
      summary: 'A mérés szerint a protokoll-tippek nem érnek a piac fölé. Éles fogadásra nem alkalmas, a szabály felülvizsgálandó.',
    };
  }
  if (criteria.every((c) => c.ok)) {
    return {
      status: 'ready',
      criteria,
      summary: 'Minden feltétel teljesül: a protokoll-tippek bizonyítottan a záró ár fölött készülnek. Éles fogadás csak kis téttel és a megadott keretben javasolt.',
    };
  }
  if (m.settled < 30 && m.clv.n < 30) {
    return { status: 'collecting', criteria, summary: 'Adatgyűjtés: még kevés a tipp a következtetéshez. Csak papíron követhető.' };
  }
  return { status: 'paper', criteria, summary: 'Csak papír: a bizonyíték még nem elég az éles fogadáshoz.' };
}

/**
 * A B (magas valószínűségű) protokoll kapuja. Négy feltétel egyszerre:
 *  1. legalább `minSettled` lezárt tipp,
 *  2. kalibráció: a tényleges találati arány nem marad szignifikánsan (z < -1,96) a becsült alatt,
 *  3. a CLV átlaga nem negatív (legalább `minClvSamples` mintával): az ár nem rosszabb a záró fair árnál,
 *  4. a papír ROI nem negatív.
 * "stop": szignifikánsan rosszabb találati arány a becsültnél, bizonyítottan negatív CLV, vagy a ROI teljes
 * intervalluma negatív (100+ lezárt tippel).
 */
function gateForProb(
  m: { settled: number; clv: ClvStats; roiPct: number; roiHigh: number; calibration?: Calibration },
  cfg: ProtocolConfig
): ProtocolStats['gate'] {
  const g = cfg.gate;
  const cal = m.calibration ?? { n: 0, predictedPct: 0, observedPct: 0, z: 0 };
  const calOk = cal.n >= g.minSettled && cal.z > -1.96;
  const criteria: GateCriterion[] = [
    {
      key: 'settled',
      label: 'Lezárt tippek',
      have: String(m.settled),
      need: `legalább ${g.minSettled}`,
      ok: m.settled >= g.minSettled,
      progress: Math.min(1, m.settled / g.minSettled),
    },
    {
      key: 'calibration',
      label: 'Találati arány a becsülthöz képest',
      have: cal.n > 0 ? `${cal.observedPct.toFixed(1)}% tényleges / ${cal.predictedPct.toFixed(1)}% becsült (n = ${cal.n})` : 'nincs adat',
      need: 'nem szignifikánsan alacsonyabb a becsültnél',
      ok: calOk,
      progress: Math.min(1, cal.n / g.minSettled),
    },
    {
      key: 'clv',
      label: 'Záró árhoz mért ár-előny (CLV)',
      have: m.clv.n > 0 ? `${m.clv.meanClvPct >= 0 ? '+' : ''}${m.clv.meanClvPct.toFixed(2)}%, n = ${m.clv.n}` : 'nincs adat',
      need: `n ≥ ${g.minClvSamples} és az átlag ≥ 0`,
      ok: m.clv.n >= g.minClvSamples && m.clv.meanClvPct >= 0,
      progress: Math.min(1, m.clv.n / g.minClvSamples),
    },
    {
      key: 'roi',
      label: 'Papír ROI',
      have: m.settled > 0 ? `${m.roiPct >= 0 ? '+' : ''}${m.roiPct.toFixed(1)}%` : 'nincs adat',
      need: `legalább ${g.minRoiPct}%`,
      ok: m.settled >= g.minSettled && m.roiPct >= g.minRoiPct,
      progress: m.settled >= g.minSettled ? (m.roiPct >= g.minRoiPct ? 1 : 0.5) : Math.min(1, m.settled / g.minSettled),
    },
  ];
  const stop =
    (cal.n >= g.minSettled && cal.z < -1.96) ||
    m.clv.verdict === 'negative' ||
    (m.settled >= g.minSettled && m.roiHigh < g.minRoiPct);
  if (stop) {
    return {
      status: 'stop',
      criteria,
      summary: 'A mérés szerint a tippek nem nyernek a becsült arányban, vagy rosszabb áron készülnek a fair árnál. Éles fogadásra nem alkalmas.',
    };
  }
  if (criteria.every((c) => c.ok)) {
    return {
      status: 'ready',
      criteria,
      summary: 'Minden feltétel teljesül: a találati arány a becsültnek megfelel, az ár nem rosszabb a fair árnál, és a papír ROI nem negatív. Éles fogadás csak kis téttel és kerettel javasolt.',
    };
  }
  if (m.settled < 30) {
    return { status: 'collecting', criteria, summary: 'Adatgyűjtés: még kevés a tipp a következtetéshez. Csak papíron követhető.' };
  }
  return { status: 'paper', criteria, summary: 'Csak papír: a bizonyíték még nem elég az éles fogadáshoz.' };
}

/** Importált (nem megbízható) protokoll-bélyeg ellenőrzése: csak értelmes verzió, ujjlenyomat és eltérés marad meg. */
export function sanitizeProtocolStamp(x: unknown): PredictionAuditRecord['protocol'] {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  if (typeof o.version !== 'number' || !Number.isInteger(o.version) || o.version < 1) return undefined;
  if (typeof o.fingerprint !== 'string' || !/^proto-[0-9a-f]{16}$/.test(o.fingerprint)) return undefined;
  const gap = o.gapPp;
  return {
    version: o.version,
    fingerprint: o.fingerprint,
    gapPp: typeof gap === 'number' && isFinite(gap) && gap >= 0 && gap <= 100 ? gap : null,
  };
}
