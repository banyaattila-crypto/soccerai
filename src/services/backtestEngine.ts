/**
 * Walk-forward backtest a Dixon–Coles modellre és a piaccal súlyozásra.
 *
 * Adat: football-data.co.uk CSV-k (Pinnacle záró és korábbi szorzók, O/U 2.5).
 * Elv: egy meccset csak a nála szigorúan korábbi meccsekből illesztett modell jósol (nincs előretekintés),
 * a kézi klub-priorok ki vannak kapcsolva, az időlecsengés a predikció napjához igazodik.
 *
 * Mérőszámok: log-loss, Brier, RPS (rangsorolt valószínűségi pontszám, a 1X2 sorrendi jellege miatt),
 * megbízhatósági sávok, fogadási szimuláció korábbi (nyitó) szorzókon, CLV a záró de-vigelt árhoz.
 */

import { fitDixonColesModel, computeExpectedGoalsFromModel } from './dixonColesFitting';
import { calculateDixonColesMatrix, extractMarketsFromMatrix } from './predictionEngine';
import { blendLogPool, marketProbsFromOdds } from './marketBlend';
import type { ReliabilityBin } from './calibrationService';

// ---------------------------------------------------------------------------
// Adatmodell és CSV-értelmezés
// ---------------------------------------------------------------------------

export interface BacktestMatch {
  league: string;
  season: string;
  ts: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
  /** záró 1X2 szorzók [H, D, A] */
  close1x2?: [number, number, number];
  /** korábbi (nyitó) 1X2 szorzók */
  open1x2?: [number, number, number];
  /** záró Over/Under 2.5 [over, under] */
  closeOU?: [number, number];
  openOU?: [number, number];
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseDate(dateStr: string, timeStr?: string): number {
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return NaN;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  let hh = 12;
  let mm = 0;
  const t = timeStr?.match(/^(\d{1,2}):(\d{2})$/);
  if (t) {
    hh = Number(t[1]);
    mm = Number(t[2]);
  }
  return Date.UTC(year, month - 1, day, hh, mm);
}

/** Az első érvényes (>1) szorzó-csoport a megadott oszlopcsoportok közül. */
function firstOdds(row: Record<string, string>, groups: string[][]): number[] | undefined {
  for (const g of groups) {
    const vals = g.map((k) => Number(row[k]));
    if (vals.every((v) => Number.isFinite(v) && v > 1)) return vals;
  }
  return undefined;
}

export function parseFootballDataCsv(text: string, league: string, season: string): BacktestMatch[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]);
  const out: BacktestMatch[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    const hg = Number(row.FTHG);
    const ag = Number(row.FTAG);
    const ts = parseDate(row.Date ?? '', row.Time);
    if (!row.HomeTeam || !row.AwayTeam || !Number.isFinite(hg) || !Number.isFinite(ag) || isNaN(ts)) continue;
    if (row.FTHG === '' || row.FTAG === '') continue;

    const c = firstOdds(row, [
      ['PSCH', 'PSCD', 'PSCA'],
      ['AvgCH', 'AvgCD', 'AvgCA'],
      ['B365CH', 'B365CD', 'B365CA'],
    ]);
    const o = firstOdds(row, [
      ['PSH', 'PSD', 'PSA'],
      ['B365H', 'B365D', 'B365A'],
    ]);
    const cou = firstOdds(row, [
      ['PC>2.5', 'PC<2.5'],
      ['AvgC>2.5', 'AvgC<2.5'],
    ]);
    const ou = firstOdds(row, [
      ['P>2.5', 'P<2.5'],
      ['B365>2.5', 'B365<2.5'],
    ]);

    out.push({
      league,
      season,
      ts,
      home: row.HomeTeam,
      away: row.AwayTeam,
      hg,
      ag,
      close1x2: c as [number, number, number] | undefined,
      open1x2: o as [number, number, number] | undefined,
      closeOU: cou as [number, number] | undefined,
      openOU: ou as [number, number] | undefined,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Mérőszámok
// ---------------------------------------------------------------------------

export type Triple = [number, number, number];

export function outcomeIndex(hg: number, ag: number): 0 | 1 | 2 {
  return hg > ag ? 0 : hg === ag ? 1 : 2;
}

export function logLoss(p: number[], idx: number): number {
  return -Math.log(Math.max(1e-6, p[idx]));
}

export function brier(p: number[], idx: number): number {
  return p.reduce((acc, x, i) => acc + (x - (i === idx ? 1 : 0)) ** 2, 0);
}

/** Rangsorolt valószínűségi pontszám (RPS), sorrend: hazai, döntetlen, vendég. Kisebb a jobb. */
export function rps(p: number[], idx: number): number {
  const r = p.length;
  let cumP = 0;
  let cumO = 0;
  let sum = 0;
  for (let k = 0; k < r - 1; k++) {
    cumP += p[k];
    cumO += k === idx ? 1 : 0;
    sum += (cumP - cumO) ** 2;
  }
  return sum / (r - 1);
}

// ---------------------------------------------------------------------------
// Walk-forward predikció
// ---------------------------------------------------------------------------

export interface PredictionRecord {
  match: BacktestMatch;
  /** modell 1X2, 0..1 */
  model: Triple;
  /** modell Over 2.5, 0..1 */
  modelOver25: number;
  lh: number;
  la: number;
}

export interface WalkForwardOptions {
  /** Ennyi napnál gyakrabban nem illesztünk újra */
  refitEveryDays: number;
  /** Ennyi korábbi ligás meccs alatt nem jósolunk */
  minTrainMatches: number;
  /** Csak az ezen időpont utáni meccsekre készül predikció (az előtte lévők csak tanítanak) */
  predictFromTs: number;
  xi: number;
  /** A csapaterősség 1,0 felé húzásának erőssége (K) */
  priorStrength: number;
}

export const DEFAULT_WALK_FORWARD: WalkForwardOptions = {
  refitEveryDays: 7,
  minTrainMatches: 100,
  predictFromTs: 0,
  xi: 0.0015,
  priorStrength: 5,
};

const DAY_MS = 24 * 3600 * 1000;

export function walkForward(
  matches: BacktestMatch[],
  options: Partial<WalkForwardOptions> = {}
): PredictionRecord[] {
  const opt = { ...DEFAULT_WALK_FORWARD, ...options };
  const byLeague = new Map<string, BacktestMatch[]>();
  for (const m of matches) {
    if (!byLeague.has(m.league)) byLeague.set(m.league, []);
    byLeague.get(m.league)!.push(m);
  }

  const records: PredictionRecord[] = [];

  for (const [league, list] of byLeague) {
    const sorted = [...list].sort((a, b) => a.ts - b.ts);
    let model: ReturnType<typeof fitDixonColesModel> | null = null;
    let fittedAt = -Infinity;

    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      if (m.ts < opt.predictFromTs) continue;
      if (i < opt.minTrainMatches) continue;

      if (m.ts - fittedAt >= opt.refitEveryDays * DAY_MS || !model) {
        // csak a nála szigorúan korábbi meccsek tanítanak; az "ma" a predikció napja
        const train = sorted
          .slice(0, i)
          .filter((x) => x.ts < m.ts)
          .map((x) => ({
            homeTeam: x.home,
            awayTeam: x.away,
            homeGoals: x.hg,
            awayGoals: x.ag,
            date: new Date(x.ts).toISOString().slice(0, 10),
          }));
        if (train.length < opt.minTrainMatches) continue;
        model = fitDixonColesModel(train, league, opt.xi, 35, m.ts, opt.priorStrength);
        fittedAt = m.ts;
      }

      const est = computeExpectedGoalsFromModel(model, m.home, m.away, 1.45, 1.15, false);
      const mat = calculateDixonColesMatrix(est.homeXg, est.awayXg, model.rho);
      const mk = extractMarketsFromMatrix(mat);
      records.push({
        match: m,
        model: [mk.home, mk.draw, mk.away],
        modelOver25: mk.over25,
        lh: est.homeXg,
        la: est.awayXg,
      });
    }
  }
  return records.sort((a, b) => a.match.ts - b.match.ts);
}

// ---------------------------------------------------------------------------
// Értékelés
// ---------------------------------------------------------------------------

export interface ScoreSummary {
  n: number;
  logLoss: number;
  brier: number;
  rps: number;
}

function summarize(items: { p: number[]; idx: number }[]): ScoreSummary {
  const n = items.length;
  if (n === 0) return { n: 0, logLoss: NaN, brier: NaN, rps: NaN };
  let ll = 0;
  let br = 0;
  let rp = 0;
  for (const it of items) {
    ll += logLoss(it.p, it.idx);
    br += brier(it.p, it.idx);
    rp += rps(it.p, it.idx);
  }
  return { n, logLoss: ll / n, brier: br / n, rps: rp / n };
}

/** Az 1X2 piac de-vigelt záró valószínűsége (0..1), ha van. */
export function marketClose1x2(m: BacktestMatch): Triple | null {
  if (!m.close1x2) return null;
  const p = marketProbsFromOdds([...m.close1x2]);
  return p ? ([p[0], p[1], p[2]] as Triple) : null;
}

export function marketCloseOver25(m: BacktestMatch): number | null {
  if (!m.closeOU) return null;
  const p = marketProbsFromOdds([...m.closeOU]);
  return p ? p[0] : null;
}

export interface SourceScores {
  model: ScoreSummary;
  market: ScoreSummary;
  blend: ScoreSummary;
  naive: ScoreSummary;
}

/**
 * 1X2: modell, piac, keverék (wModel) és naiv (a tanító-minta gyakorisága) összevetése azonos meccshalmazon.
 */
export function evaluate1x2(records: PredictionRecord[], wModel: number): SourceScores {
  const usable = records.filter((r) => marketClose1x2(r.match) !== null);
  // naiv: kimenetel-gyakoriság az adott halmazon (kissé optimista bázis, ezért szigorú összehasonlítás)
  const freq: Triple = [0, 0, 0];
  usable.forEach((r) => (freq[outcomeIndex(r.match.hg, r.match.ag)] += 1));
  const base = freq.map((f) => f / Math.max(1, usable.length));

  const model: { p: number[]; idx: number }[] = [];
  const market: { p: number[]; idx: number }[] = [];
  const blend: { p: number[]; idx: number }[] = [];
  const naive: { p: number[]; idx: number }[] = [];
  for (const r of usable) {
    const idx = outcomeIndex(r.match.hg, r.match.ag);
    const mk = marketClose1x2(r.match)!;
    model.push({ p: r.model, idx });
    market.push({ p: mk, idx });
    blend.push({ p: blendLogPool(r.model, mk, wModel), idx });
    naive.push({ p: base, idx });
  }
  return {
    model: summarize(model),
    market: summarize(market),
    blend: summarize(blend),
    naive: summarize(naive),
  };
}

/** Over/Under 2.5 log-loss (kétkimenetelű): modell, piac, keverék. */
export function evaluateTotals(records: PredictionRecord[], wModel: number) {
  const usable = records.filter((r) => marketCloseOver25(r.match) !== null);
  const sum = { model: 0, market: 0, blend: 0 };
  for (const r of usable) {
    const over = r.match.hg + r.match.ag > 2.5 ? 1 : 0;
    const pm = [r.modelOver25, 1 - r.modelOver25];
    const mk = marketCloseOver25(r.match)!;
    const pk = [mk, 1 - mk];
    const pb = blendLogPool(pm, pk, wModel);
    const idx = over ? 0 : 1;
    sum.model += logLoss(pm, idx);
    sum.market += logLoss(pk, idx);
    sum.blend += logLoss(pb, idx);
  }
  const n = usable.length;
  return {
    n,
    model: sum.model / Math.max(1, n),
    market: sum.market / Math.max(1, n),
    blend: sum.blend / Math.max(1, n),
  };
}

/** A log-loss-t minimalizáló modell-súly (0..1, 0,05-ös rács) az 1X2 keverékhez. */
export function fitBlendWeight1x2(records: PredictionRecord[]): { w: number; logLoss: number } {
  let best = { w: 0, logLoss: Infinity };
  for (let k = 0; k <= 20; k++) {
    const w = k / 20;
    const s = evaluate1x2(records, w).blend.logLoss;
    if (s < best.logLoss) best = { w, logLoss: s };
  }
  return best;
}

export function fitBlendWeightTotals(records: PredictionRecord[]): { w: number; logLoss: number } {
  let best = { w: 0, logLoss: Infinity };
  for (let k = 0; k <= 20; k++) {
    const w = k / 20;
    const s = evaluateTotals(records, w).blend;
    if (s < best.logLoss) best = { w, logLoss: s };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Megbízhatósági sávok
// ---------------------------------------------------------------------------

/**
 * Megbízhatósági sávok az összes kimenetel (hazai/döntetlen/vendég) valószínűségére: a modell által
 * adott esély és a tényleges gyakoriság, 10 százalékpontos sávokban.
 */
export function reliabilityBins1x2(items: { p: number[]; idx: number }[]): ReliabilityBin[] {
  const edges = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.0001];
  const bins = edges.slice(0, -1).map((min, i) => ({
    min,
    max: edges[i + 1],
    predSum: 0,
    hits: 0,
    count: 0,
  }));
  for (const it of items) {
    it.p.forEach((prob, outcome) => {
      const b = bins.find((x) => prob >= x.min && prob < x.max);
      if (!b) return;
      b.predSum += prob;
      b.hits += outcome === it.idx ? 1 : 0;
      b.count += 1;
    });
  }
  return bins.map((b) => {
    const avg = b.count > 0 ? (b.predSum / b.count) * 100 : ((b.min + Math.min(b.max, 1)) / 2) * 100;
    const obs = b.count > 0 ? (b.hits / b.count) * 100 : 0;
    const gap = Math.abs(avg - obs);
    return {
      binLabel: `${Math.round(b.min * 100)}% – ${Math.min(100, Math.round(b.max * 100))}%`,
      binMin: b.min,
      binMax: b.max,
      count: b.count,
      avgPredictedProb: Number(avg.toFixed(1)),
      observedHitRate: Number(obs.toFixed(1)),
      calibrationGap: Number(gap.toFixed(1)),
      isWellCalibrated: gap <= 3.0,
    };
  });
}

// ---------------------------------------------------------------------------
// Fogadási szimuláció: nyitó szorzón fogad, a záró de-vigelt árhoz mért CLV-vel
// ---------------------------------------------------------------------------

export interface BettingResult {
  threshold: number;
  bets: number;
  roiPct: number;
  /** átlagos állított EV (a nyitó szorzón, a használt valószínűségből), % */
  claimedEvPct: number;
  /** átlagos CLV: nyitó szorzó · záró fair valószínűség − 1, % */
  clvPct: number;
  zScore: number;
}

/**
 * 'model': a nyers modell-valószínűség a nyitó szorzó ellen (ezt tette a korábbi app "+EV" jelzése).
 * 'blend': a modell és a NYITÓ szorzóból de-vigelt piac keveréke (valósan elérhető információ; a záró árat nem használja).
 */
export type ProbSource = 'model' | 'blend';

export function simulateBetting(
  records: PredictionRecord[],
  source: ProbSource,
  wModel: number,
  threshold: number
): BettingResult {
  const returns: number[] = [];
  let claimed = 0;
  let clv = 0;
  for (const r of records) {
    const open = r.match.open1x2;
    const close = marketClose1x2(r.match);
    if (!open || !close) continue;
    const openFair = marketProbsFromOdds([...open]);
    if (!openFair) continue;
    const p: Triple = source === 'model' ? r.model : (blendLogPool(r.model, openFair, wModel) as Triple);
    const idx = outcomeIndex(r.match.hg, r.match.ag);
    for (let k = 0; k < 3; k++) {
      const ev = p[k] * open[k] - 1;
      if (ev > threshold) {
        returns.push(k === idx ? open[k] - 1 : -1);
        claimed += ev;
        clv += open[k] * close[k] - 1;
      }
    }
  }
  const n = returns.length;
  if (n === 0) return { threshold, bets: 0, roiPct: 0, claimedEvPct: 0, clvPct: 0, zScore: 0 };
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
  const se = Math.sqrt(variance / n);
  return {
    threshold,
    bets: n,
    roiPct: mean * 100,
    claimedEvPct: (claimed / n) * 100,
    clvPct: (clv / n) * 100,
    zScore: se > 0 ? mean / se : 0,
  };
}

/** Az 1X2 log-loss a modell-súly függvényében (a hangolás görbéje). */
export function weightCurve1x2(records: PredictionRecord[], weights: number[]): { w: number; logLoss: number }[] {
  return weights.map((w) => ({ w, logLoss: evaluate1x2(records, w).blend.logLoss }));
}

/** Viszonyítási alap: minden kimenetelre fogadva a hozam kb. a piac árrésének mínusza. */
export function baselineBetAll(records: PredictionRecord[]): { bets: number; roiPct: number } {
  let n = 0;
  let sum = 0;
  for (const r of records) {
    const open = r.match.open1x2;
    if (!open) continue;
    const idx = outcomeIndex(r.match.hg, r.match.ag);
    for (let k = 0; k < 3; k++) {
      n++;
      sum += k === idx ? open[k] - 1 : -1;
    }
  }
  return { bets: n, roiPct: n > 0 ? (sum / n) * 100 : 0 };
}
