import { Match, PredictionAuditRecord, VerifiedAuditStats } from '../types/football';
import { evaluatePickWon } from './betEvaluation';
import { eventBus } from '../utils/eventBus';
import { sha256Hex } from '../utils/sha256';
import { marketSnapshotForPick, sanitizeSnapshot } from './clvService';

export const STORAGE_KEY_AUDIT_LOG = 'soccerai_prediction_audit_log_v2';
export const AUDIT_BASE_STAKE = 10000; // 10 000 Ft alaptét a hitelesített ROI és nyereség számításához
export const MAX_AUDIT_RECORDS = 300;

/**
 * Kiszámolja egy mérkőzés pontos kezdési időpontját (epoch milliszekundumban).
 */
export function getMatchKickoffTimestamp(match: Match): number {
  if (match.utcDate) {
    const ts = new Date(match.utcDate).getTime();
    if (!isNaN(ts)) return ts;
  }
  if (match.kickoffDate && match.kickoffTime) {
    const ts = new Date(`${match.kickoffDate}T${match.kickoffTime}:00`).getTime();
    if (!isNaN(ts)) return ts;
  }
  if (match.kickoffDate) {
    const ts = new Date(`${match.kickoffDate}T18:00:00`).getTime();
    if (!isNaN(ts)) return ts;
  }
  return 0;
}

/**
 * Szigorú kezdés előtti ellenőrzés (Pre-kickoff verification):
 * Egy predikció KIZÁRÓLAG akkor tekinthető hiteles, kezdés előtti előrejelzésnek,
 * ha a meccs státusza még UPCOMING és a hivatalos kezdési időpont a jövőben van.
 */
export function isMatchBeforeKickoff(match: Match, nowMs: number = Date.now()): boolean {
  if (match.status !== 'UPCOMING') {
    return false;
  }
  const kickoffTs = getMatchKickoffTimestamp(match);
  if (kickoffTs === 0) {
    return false;
  }
  // 30 másodperces óra-eltolódási puffer a szerver/kliens közötti szinkronhoz
  return nowMs < kickoffTs + 30000;
}

type RecordHashInput = {
  matchId: string;
  kickoffTimestamp: number;
  loggedAt: string;
  market: string;
  probability: number;
  odds: number;
};

function recordHashPayload(data: RecordHashInput): string {
  return `${data.matchId}|${data.kickoffTimestamp}|${data.loggedAt}|${data.market}|${data.probability}|${data.odds}`;
}

/**
 * Determinisztikus ellenőrző összeg (SHA-256, `audit2-` előtaggal) a rögzítés időpontjáról, a meccs kezdéséről,
 * a piacról, a valószínűségről és a szorzóról.
 *
 * FIGYELEM: kulcs nélküli, kliensoldali összeg. Véletlen sérülést és a naplófájl óvatlan szerkesztését jelzi, de aki
 * ismeri a képletet, új összeget is számolhat egy módosított rekordhoz. Valódi hamisítás-védelemhez szerveroldali,
 * kulcsos (HMAC) napló kellene; ezt a rendszer jelenleg nem nyújtja.
 */
export function computeRecordHash(data: RecordHashInput): string {
  return `audit2-${sha256Hex(recordHashPayload(data))}`;
}

/** A v1.32.0 előtt rögzített rekordok 53 bites összege (`audit-` előtag): csak visszafelé kompatibilitásból fogadjuk el. */
function computeLegacyRecordHash(data: RecordHashInput): string {
  const str = recordHashPayload(data);
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 =
    Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^
    Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 =
    Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^
    Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & hash2) + (hash1 >>> 0))
    .toString(16)
    .padStart(14, '0');
  return `audit-${hex}`;
}

/** Egyezik-e a tárolt összeg az újraszámolttal (új SHA-256 vagy régi formátum). */
export function verifyRecordHash(data: RecordHashInput, stored: string): boolean {
  if (stored.startsWith('audit2-')) return stored === computeRecordHash(data);
  return stored === computeLegacyRecordHash(data);
}

/**
 * Betölti a megmásíthatatlan predikciónaplót a helyi tárolóból.
 */
export function getAuditLog(): PredictionAuditRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PredictionAuditRecord[]) : [];
  } catch (err) {
    console.warn('Nem sikerült betölteni az audit naplót:', err);
    return [];
  }
}

/**
 * Menti a predikciónaplót a helyi tárolóba.
 */
export function saveAuditLog(records: PredictionAuditRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const sorted = [...records]
      .sort((a, b) => b.kickoffTimestamp - a.kickoffTimestamp)
      .slice(0, MAX_AUDIT_RECORDS);
    localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(sorted));
    eventBus.emit('audit_log_updated');
  } catch (err) {
    console.warn('Nem sikerült elmenteni az audit naplót:', err);
  }
}

/**
 * Kezdés előtti előrejelzések rögzítése a megmásíthatatlan naplóba (WRITE-ONCE / APPEND-ONLY).
 *
 * Szigorú integritási garanciák:
 * 1. Ha egy matchId már szerepel a naplóban, azt SOHA NEM írja felül (fagyasztott tipp).
 * 2. Ha a mérkőzés már elkezdődött vagy véget ért, a rendszer ELUTASÍTJA a hitelesített naplózást.
 * 3. Minden bejegyzés megkapja a pontos rögzítési időbélyeget és integritási hash-t.
 */
export function recordPreMatchPredictions(
  matches: Match[],
  nowMs: number = Date.now()
): { added: number; skipped: number } {
  if (!matches || matches.length === 0) {
    return { added: 0, skipped: 0 };
  }

  const existingLog = getAuditLog();
  const existingMap = new Map<string, PredictionAuditRecord>();
  existingLog.forEach((r) => existingMap.set(r.matchId, r));

  let added = 0;
  let skipped = 0;

  for (const match of matches) {
    // 1. Csak akkor tudunk auditálni, ha a modell generált AI tippet
    if (!match.aiPick) {
      skipped++;
      continue;
    }

    // 2. NEM FELÜLÍRHATÓ: Ha már korábban rögzítettük a meccset, érintetlenül hagyjuk!
    if (existingMap.has(match.id)) {
      skipped++;
      continue;
    }

    // 3. SZIGORÚ KEZDÉS ELŐTTI FELTÉTEL: Utólag vagy meccs közben nem rögzíthető hitelesített tipp!
    if (!isMatchBeforeKickoff(match, nowMs)) {
      skipped++;
      continue;
    }

    const kickoffTimestamp = getMatchKickoffTimestamp(match);
    const loggedAt = new Date(nowMs).toISOString();
    const auditHash = computeRecordHash({
      matchId: match.id,
      kickoffTimestamp,
      loggedAt,
      market: match.aiPick.market,
      probability: match.aiPick.probability,
      odds: match.aiPick.odds,
    });

    const newRecord: PredictionAuditRecord = {
      id: `audit-${match.id}-${kickoffTimestamp}`,
      matchId: match.id,
      loggedAt,
      kickoffDate: match.kickoffDate,
      kickoffTime: match.kickoffTime || '18:00',
      kickoffTimestamp,
      utcDate: match.utcDate,
      leagueId: match.leagueId,
      leagueName: match.leagueName,
      leagueCountry: match.leagueCountry,
      leagueFlag: match.leagueFlag,
      homeTeam: {
        name: match.homeTeam.name,
        logo: match.homeTeam.logo,
        shortName: match.homeTeam.shortName,
      },
      awayTeam: {
        name: match.awayTeam.name,
        logo: match.awayTeam.logo,
        shortName: match.awayTeam.shortName,
      },
      pick: {
        market: match.aiPick.market,
        marketLabel: match.aiPick.marketLabel,
        probability: match.aiPick.probability,
        odds: match.aiPick.odds,
        confidence: match.aiPick.confidence,
        expectedValue: match.aiPick.expectedValue,
        quarterKellyPct: match.aiPick.quarterKellyPct,
        isSimulatedOdds: match.aiPick.isSimulatedOdds,
        reasoning: match.aiPick.reasoning,
      },
      modelSnapshot: {
        // A modell saját valószínűségei (nem a piaci felülírás): a kalibrációs mérés a modellt méri
        probabilities: { ...(match.modelProbabilities ?? match.probabilities) },
        robustnessVerdict: match.quantAnalysis?.robustnessVerdict,
        dataQuality: match.quantAnalysis?.dataQuality,
      },
      // Piaci pillanatkép a CLV-hez: csak valós szorzónál (a szimulált ár nem piaci ár)
      marketAtLog:
        match.aiPick.isSimulatedOdds === false
          ? marketSnapshotForPick(match, match.aiPick.market, nowMs)
          : undefined,
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash,
      settled: false,
      status: 'PENDING',
      profit: 0,
      roi: 0,
    };

    existingMap.set(match.id, newRecord);
    added++;
  }

  if (added > 0) {
    saveAuditLog(Array.from(existingMap.values()));
  }

  return { added, skipped };
}

/**
 * A még le nem zárt, valós szorzón naplózott tippek záró piaci pillanatképének frissítése.
 * Minden kezdés előtti hívás a legfrissebb érvényes pillanatképpel felülírja a `marketClose`-t, így a kezdés előtti
 * utolsó ismert fair ár marad meg. A tipp (piac, valószínűség, szorzó) és az auditHash nem változik.
 */
export function updateClosingSnapshots(
  matches: Match[],
  nowMs: number = Date.now()
): { updated: number } {
  if (!matches || matches.length === 0) return { updated: 0 };
  const log = getAuditLog();
  if (log.length === 0) return { updated: 0 };
  const byId = new Map<string, Match>(matches.map((m) => [m.id, m]));
  let updated = 0;
  for (const rec of log) {
    if (rec.settled || rec.pick.isSimulatedOdds !== false) continue;
    if (nowMs >= rec.kickoffTimestamp) continue;
    const match = byId.get(rec.matchId);
    if (!match || !isMatchBeforeKickoff(match, nowMs)) continue;
    const snap = marketSnapshotForPick(match, rec.pick.market, nowMs);
    if (!snap) continue;
    rec.marketClose = snap;
    updated++;
  }
  if (updated > 0) saveAuditLog(log);
  return { updated };
}

/**
 * Korábban kezdés előtt rögzített predikciók lezárása (Settlement)
 * kizárólag a valós, befejezett API végeredmények alapján.
 */
export function settleAuditPredictions(
  matches: Match[],
  baseStake: number = AUDIT_BASE_STAKE
): { settledCount: number } {
  if (!matches || matches.length === 0) {
    return { settledCount: 0 };
  }

  const log = getAuditLog();
  let settledCount = 0;

  for (const match of matches) {
    if (
      match.status !== 'FINISHED' ||
      typeof match.homeScore !== 'number' ||
      typeof match.awayScore !== 'number'
    ) {
      continue;
    }

    const record = log.find((r) => r.matchId === match.id);
    if (!record) {
      // Nem volt kezdés előtt rögzítve -> nem minősülhet igazolt auditált predikciónak!
      continue;
    }

    if (record.settled) {
      // Már korábban lezárva
      continue;
    }

    // Kiértékelés a megváltoztathatatlanul rögzített eredeti piaci tippel
    const isWon = evaluatePickWon(
      match.homeScore,
      match.awayScore,
      record.pick.market,
      record.pick.marketLabel,
      match.homeHalfTimeScore,
      match.awayHalfTimeScore
    );

    record.settled = true;
    record.settledAt = new Date().toISOString();
    record.homeScore = match.homeScore;
    record.awayScore = match.awayScore;
    record.homeHalfTimeScore = match.homeHalfTimeScore;
    record.awayHalfTimeScore = match.awayHalfTimeScore;
    record.status = isWon === true ? 'WON' : isWon === false ? 'LOST' : 'VOID';
    record.profit =
      isWon === true
        ? Math.round((record.pick.odds - 1) * baseStake)
        : isWon === false
        ? -baseStake
        : 0;
    record.roi =
      isWon === true
        ? Math.round((record.pick.odds - 1) * 1000) / 10
        : isWon === false
        ? -100
        : 0;

    settledCount++;
  }

  if (settledCount > 0) {
    saveAuditLog(log);
  }

  return { settledCount };
}

/**
 * Kiszámolja a hivatalos, hitelesített statisztikákat (Verified Audit Stats).
 * KIZÁRÓLAG a VERIFIED_PRE_MATCH és lezárt mérkőzések számítanak bele!
 * A régi vagy utólagos ROI-k szigorúan ki vannak zárva.
 */
export function getVerifiedAuditStats(
  customRecords?: PredictionAuditRecord[],
  baseStake: number = AUDIT_BASE_STAKE
): VerifiedAuditStats {
  const records = customRecords || getAuditLog();
  const verifiedRecords = records.filter((r) => r.provenance === 'VERIFIED_PRE_MATCH');
  const pendingRecords = verifiedRecords.filter((r) => !r.settled);
  const settledRecords = verifiedRecords.filter((r) => r.settled && r.status !== 'VOID');

  const totalAudited = verifiedRecords.length;
  const pendingCount = pendingRecords.length;
  const settledCount = settledRecords.length;
  const wonCount = settledRecords.filter((r) => r.status === 'WON').length;
  const lostCount = settledRecords.filter((r) => r.status === 'LOST').length;

  const winRate =
    settledCount > 0 ? Math.round((wonCount / settledCount) * 1000) / 10 : 0;
  const totalStaked = settledCount * baseStake;
  const netProfit = settledRecords.reduce((acc, r) => acc + r.profit, 0);
  const totalReturned = totalStaked + netProfit;
  const roi =
    totalStaked > 0 ? Math.round((netProfit / totalStaked) * 1000) / 10 : 0;

  const winningOdds = settledRecords
    .filter((r) => r.status === 'WON')
    .map((r) => r.pick.odds);
  const avgWinningOdds =
    winningOdds.length > 0
      ? Math.round((winningOdds.reduce((a, b) => a + b, 0) / winningOdds.length) * 100) / 100
      : 0;

  return {
    totalAudited,
    pendingCount,
    settledCount,
    wonCount,
    lostCount,
    winRate,
    totalStaked,
    totalReturned,
    netProfit,
    roi,
    avgWinningOdds,
  };
}

/**
 * Piaconkénti bontás a hitelesített lezárt predikciókból
 */
export function getVerifiedMarketBreakdown(
  records?: PredictionAuditRecord[],
  baseStake: number = AUDIT_BASE_STAKE
) {
  const allRecords = records || getAuditLog();
  const settled = allRecords.filter(
    (r) => r.provenance === 'VERIFIED_PRE_MATCH' && r.settled && r.status !== 'VOID'
  );

  const categories = [
    { id: '1X2', label: 'Csapat Győzelmek (1X2)' },
    { id: 'BTTS', label: 'Mindkét Csapat Szerez Gólt' },
    { id: 'OVER_25', label: '2.5 Gól Felett' },
    { id: 'UNDER_25', label: '2.5 Gól Alatt' },
    { id: 'COMBINED', label: 'BTTS & 2.5 Felett Kombinált' },
  ];

  return categories.map((cat) => {
    const items = settled.filter((r) => {
      const m = r.pick.market;
      if (cat.id === '1X2') return ['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN'].includes(m);
      if (cat.id === 'BTTS') return ['BTTS', 'BTTS_YES'].includes(m);
      if (cat.id === 'OVER_25') return m === 'OVER_25';
      if (cat.id === 'UNDER_25') return m === 'UNDER_25';
      if (cat.id === 'COMBINED') return m === 'BTTS_AND_OVER25';
      return false;
    });

    const total = items.length;
    const won = items.filter((i) => i.status === 'WON').length;
    const winRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
    const profit = items.reduce((acc, i) => acc + i.profit, 0);
    const roi = total > 0 ? Math.round((profit / (total * baseStake)) * 1000) / 10 : 0;

    return {
      ...cat,
      total,
      won,
      winRate,
      profit,
      roi,
    };
  });
}

/**
 * Audit napló törlése
 */
export function clearAuditLog(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_AUDIT_LOG);
  eventBus.emit('audit_log_updated');
}

/**
 * Audit napló exportálása átláthatósági ellenőrzéshez JSON formátumban
 */
export function exportAuditLogAsJson(): string {
  const log = getAuditLog();
  const stats = getVerifiedAuditStats(log);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      system: 'SoccerAI Dixon-Coles Prediction Audit Log v2',
      integrityPolicy: 'Pre-kickoff write-once immutable ledger',
      stats,
      records: log,
    },
    null,
    2
  );
}

export interface AuditImportResult {
  success: boolean;
  importedCount: number;
  rejectedCount: number;
  verifiedCount: number;
  totalRecordsInLog: number;
  message: string;
  errors: string[];
}

/**
 * Audit napló importálása JSON szövegből szigorú kriptográfiai és integritási ellenőrzéssel.
 * Csak olyan rekordokat fogad el, amelyek rendelkeznek érvényes pre-kickoff tamper-evident ellenőrző aláírással (auditHash).
 */
export function importAuditLogFromJson(jsonStr: string): AuditImportResult {
  try {
    const parsed = JSON.parse(jsonStr);
    const candidateRecords: PredictionAuditRecord[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.records)
      ? parsed.records
      : [];

    if (candidateRecords.length === 0) {
      return {
        success: false,
        importedCount: 0,
        rejectedCount: 0,
        verifiedCount: 0,
        totalRecordsInLog: getAuditLog().length,
        message: 'A megadott JSON nem tartalmaz auditált predikciós rekordokat.',
        errors: ['A JSON fájl nem tartalmaz feldolgozható rekordokat.'],
      };
    }

    const currentLog = getAuditLog();
    const map = new Map<string, PredictionAuditRecord>();
    for (const r of currentLog) {
      map.set(r.id, r);
    }

    let importedCount = 0;
    let rejectedCount = 0;
    const errors: string[] = [];

    for (const r of candidateRecords) {
      // 1. Mezők alapszintű ellenőrzése
      if (
        !r.id ||
        !r.matchId ||
        !r.loggedAt ||
        !r.kickoffDate ||
        !r.kickoffTime ||
        typeof r.kickoffTimestamp !== 'number' ||
        !r.pick ||
        !r.pick.market ||
        typeof r.pick.odds !== 'number' ||
        typeof r.pick.probability !== 'number' ||
        !r.auditHash
      ) {
        rejectedCount++;
        continue;
      }

      // 2. Integritás-ellenőrzés (kulcs nélküli ellenőrző összeg: sérülést jelez, nem hamisítás-biztos)
      const hashOk = verifyRecordHash({
        matchId: r.matchId,
        kickoffTimestamp: r.kickoffTimestamp,
        loggedAt: r.loggedAt,
        market: r.pick.market,
        probability: r.pick.probability,
        odds: r.pick.odds,
      }, r.auditHash);

      if (!hashOk) {
        console.warn(`Audit integritási hiba a ${r.id} rekordnál: az ellenőrző összeg nem egyezik (módosított vagy sérült rekord)!`);
        rejectedCount++;
        errors.push(`Érvénytelen ellenőrző összeg a meccsnél (${r.matchId}): a rekord módosított vagy sérült.`);
        continue;
      }

      // 3. Provenance ellenőrzés
      if (r.provenance !== 'VERIFIED_PRE_MATCH') {
        rejectedCount++;
        errors.push(`Nem hitelesített pre-match rekord (${r.id}): provenance !== VERIFIED_PRE_MATCH.`);
        continue;
      }

      // 4. Elszámolás (Settlement) kötelező újraszámolása és integritási ellenőrzése
      let sanitizedSettled = Boolean(r.settled);
      let sanitizedStatus = r.status;
      let sanitizedProfit = typeof r.profit === 'number' ? r.profit : 0;
      let sanitizedRoi = typeof r.roi === 'number' ? r.roi : 0;
      let sanitizedSettledAt = r.settledAt;

      if (r.settled) {
        if (
          typeof r.homeScore !== 'number' ||
          typeof r.awayScore !== 'number' ||
          isNaN(r.homeScore) ||
          isNaN(r.awayScore)
        ) {
          // Eredmény hiányában nem lehet lezárt -> PENDING állapotba állítjuk vissza
          sanitizedSettled = false;
          sanitizedStatus = 'PENDING';
          sanitizedProfit = 0;
          sanitizedRoi = 0;
          sanitizedSettledAt = undefined;
        } else {
          // Kötelező újraszámolás a rögzített gólok és a hitelesített odds alapján
          const isWon = evaluatePickWon(
            r.homeScore,
            r.awayScore,
            r.pick.market,
            r.pick.marketLabel,
            r.homeHalfTimeScore,
            r.awayHalfTimeScore
          );

          const expectedStatus: 'WON' | 'LOST' | 'VOID' =
            isWon === true ? 'WON' : isWon === false ? 'LOST' : 'VOID';

          const expectedProfit =
            isWon === true
              ? Math.round((r.pick.odds - 1) * AUDIT_BASE_STAKE)
              : isWon === false
              ? -AUDIT_BASE_STAKE
              : 0;

          const expectedRoi =
            isWon === true
              ? Math.round((r.pick.odds - 1) * 1000) / 10
              : isWon === false
              ? -100
              : 0;

          if (r.status !== expectedStatus || r.profit !== expectedProfit) {
            console.warn(
              `Audit elszámolási eltérés a ${r.id} rekordnál: importált [${r.status}, ${r.profit} Ft] -> újraszámolt hiteles érték [${expectedStatus}, ${expectedProfit} Ft].`
            );
          }

          sanitizedSettled = true;
          sanitizedStatus = expectedStatus;
          sanitizedProfit = expectedProfit;
          sanitizedRoi = expectedRoi;
          sanitizedSettledAt = r.settledAt || new Date().toISOString();
        }
      } else {
        sanitizedSettled = false;
        sanitizedStatus = 'PENDING';
        sanitizedProfit = 0;
        sanitizedRoi = 0;
      }

      // 5. Beszúrás vagy intelligens frissítés (ha meglévő pending, de importáltban lezárt eredmény van)
      const existing = map.get(r.id);
      if (!existing) {
        map.set(r.id, {
          ...r,
          marketAtLog: sanitizeSnapshot(r.marketAtLog),
          marketClose: sanitizeSnapshot(r.marketClose),
          settled: sanitizedSettled,
          settledAt: sanitizedSettledAt,
          homeScore: sanitizedSettled ? r.homeScore : undefined,
          awayScore: sanitizedSettled ? r.awayScore : undefined,
          homeHalfTimeScore: sanitizedSettled ? r.homeHalfTimeScore : undefined,
          awayHalfTimeScore: sanitizedSettled ? r.awayHalfTimeScore : undefined,
          status: sanitizedStatus,
          profit: sanitizedProfit,
          roi: sanitizedRoi,
        });
        importedCount++;
      } else if (!existing.settled && sanitizedSettled) {
        map.set(r.id, {
          ...existing,
          settled: true,
          settledAt: sanitizedSettledAt,
          homeScore: r.homeScore,
          awayScore: r.awayScore,
          homeHalfTimeScore: r.homeHalfTimeScore,
          awayHalfTimeScore: r.awayHalfTimeScore,
          status: sanitizedStatus,
          profit: sanitizedProfit,
          roi: sanitizedRoi,
        });
        importedCount++;
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );

    saveAuditLog(merged);
    eventBus.emit('audit_log_updated');

    return {
      success: importedCount > 0,
      importedCount,
      rejectedCount,
      verifiedCount: importedCount,
      totalRecordsInLog: merged.length,
      message: `${importedCount} hitelesített rekord sikeresen importálva${
        rejectedCount > 0 ? ` (${rejectedCount} érvénytelen/hamisított rekord elutasítva)` : ''
      }.`,
      errors,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ismeretlen hiba';
    return {
      success: false,
      importedCount: 0,
      rejectedCount: 0,
      verifiedCount: 0,
      totalRecordsInLog: getAuditLog().length,
      message: `Érvénytelen JSON formátum: ${msg}`,
      errors: [`Érvénytelen JSON formátum: ${msg}`],
    };
  }
}
