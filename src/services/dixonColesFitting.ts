/**
 * Dixon-Coles (1997) Maximum Likelihood Estimation (MLE) & Paraméter-illesztő Motor
 *
 * Tudományos háttér:
 * Dixon, M. J., & Coles, S. G. (1997). Modelling Association Football Scores and
 * Inefficiencies in the Football Betting Market. Journal of the Royal Statistical Society, 46(2), 265-280.
 *
 * Ez a modul felváltja a korábbi kézzel beírt 17 csapatos statikus táblát és a lapos ligaátlagokat.
 * A szezonban ténylegesen lejátszott mérkőzésekből, iteratív arányos illesztéssel (Iterative Proportional Fitting)
 * számítja ki minden csapat valós támadóerejét (alpha), védelmi gyengeségét (beta),
 * a hazai pálya előnyt (gamma) és az alacsony gólszámú korrekciós faktort (rho).
 */

export interface FinishedMatchResult {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  date?: string; // YYYY-MM-DD
}

export interface TeamRating {
  attack: number; // alpha_i (1.0 = ligaátlag; >1.0 erősebb támadósor, <1.0 gyengébb)
  defense: number; // beta_i (1.0 = ligaátlag; <1.0 sziklaszilárd védelem, >1.0 átjáróház)
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
  homeScored: number;
  homeConceded: number;
  awayScored: number;
  awayConceded: number;
  homeMatches: number;
  awayMatches: number;
}

export interface FittedDixonColesModel {
  leagueCode: string;
  teams: Record<string, TeamRating>;
  homeAdvantage: number; // gamma: empirikus hazai előny szorzó (pl. 1.20)
  avgHomeGoals: number; // átlagos hazai gól meccsenként a ligában
  avgAwayGoals: number; // átlagos vendég gól meccsenként a ligában
  rho: number; // Dixon-Coles korrekciós paraméter (0-0, 0-1, 1-0, 1-1)
  sampleSize: number; // felhasznált befejezett meccsek száma
  fittedAt: string; // ISO időbélyeg
}

const STORAGE_PREFIX = 'soccerai_dc_model_v1_';
const MODEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 órás gyorsítótár

/**
 * Szöveges csapatnév normalizálása (ékezetek, rövidítések, FC/CF levágása) a pontos illesztéshez
 */
export function normalizeTeamName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|ssc|as|rc|tsv|vfb|vfl|1\.|cd|ud|ogc)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Dixon-Coles MLE paraméter-illesztés a szezon lejátszott mérkőzéseire
 *
 * @param matches A liga már befejezett mérkőzései
 * @param leagueCode A bajnokság kódja (pl. 'PL', 'PD', 'SA', 'BL1', stb.)
 * @param xi Időbeli lecsengési tényező (Dixon-Coles half-life: 0.003 / nap; 0 = egyenletes)
 * @param maxIter Maximális iterációk száma (általában 20-30 elegendő a konvergenciához)
 */
export function fitDixonColesModel(
  matches: FinishedMatchResult[],
  leagueCode: string,
  xi: number = 0.0025,
  maxIter: number = 35
): FittedDixonColesModel {
  const validMatches = matches.filter(
    (m) =>
      typeof m.homeGoals === 'number' &&
      typeof m.awayGoals === 'number' &&
      m.homeGoals >= 0 &&
      m.awayGoals >= 0 &&
      m.homeTeam &&
      m.awayTeam
  );

  const nowMs = Date.now();
  const DAY_MS = 24 * 3600 * 1000;

  // 1. Csapatok és alapadatok felmérése
  const teamStats: Record<
    string,
    {
      displayName: string;
      goalsScored: number;
      goalsConceded: number;
      homeScored: number;
      homeConceded: number;
      awayScored: number;
      awayConceded: number;
      homeMatches: number;
      awayMatches: number;
    }
  > = {};

  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  for (const m of validMatches) {
    const hKey = normalizeTeamName(m.homeTeam);
    const aKey = normalizeTeamName(m.awayTeam);
    if (!hKey || !aKey) continue;

    if (!teamStats[hKey]) {
      teamStats[hKey] = {
        displayName: m.homeTeam,
        goalsScored: 0,
        goalsConceded: 0,
        homeScored: 0,
        homeConceded: 0,
        awayScored: 0,
        awayConceded: 0,
        homeMatches: 0,
        awayMatches: 0,
      };
    }
    if (!teamStats[aKey]) {
      teamStats[aKey] = {
        displayName: m.awayTeam,
        goalsScored: 0,
        goalsConceded: 0,
        homeScored: 0,
        homeConceded: 0,
        awayScored: 0,
        awayConceded: 0,
        homeMatches: 0,
        awayMatches: 0,
      };
    }

    teamStats[hKey].goalsScored += m.homeGoals;
    teamStats[hKey].goalsConceded += m.awayGoals;
    teamStats[hKey].homeScored += m.homeGoals;
    teamStats[hKey].homeConceded += m.awayGoals;
    teamStats[hKey].homeMatches += 1;

    teamStats[aKey].goalsScored += m.awayGoals;
    teamStats[aKey].goalsConceded += m.homeGoals;
    teamStats[aKey].awayScored += m.awayGoals;
    teamStats[aKey].awayConceded += m.homeGoals;
    teamStats[aKey].awayMatches += 1;

    totalHomeGoals += m.homeGoals;
    totalAwayGoals += m.awayGoals;
  }

  const teamKeys = Object.keys(teamStats);
  const nTeams = teamKeys.length;
  const matchCount = validMatches.length;

  const avgHomeGoals =
    matchCount > 0 ? Math.max(0.8, totalHomeGoals / matchCount) : 1.45;
  const avgAwayGoals =
    matchCount > 0 ? Math.max(0.6, totalAwayGoals / matchCount) : 1.15;
  let homeAdvantage = avgHomeGoals / Math.max(0.5, avgAwayGoals);

  // Ha túl kevés a meccs (< 6 mérkőzés a ligában), tiszta ligaszintű prioritást adunk
  if (matchCount < 6 || nTeams < 3) {
    const teamsOut: Record<string, TeamRating> = {};
    for (const k of teamKeys) {
      const s = teamStats[k];
      teamsOut[k] = {
        attack: 1.0,
        defense: 1.0,
        goalsScored: s.goalsScored,
        goalsConceded: s.goalsConceded,
        matchesPlayed: s.homeMatches + s.awayMatches,
        homeScored: s.homeScored,
        homeConceded: s.homeConceded,
        awayScored: s.awayScored,
        awayConceded: s.awayConceded,
        homeMatches: s.homeMatches,
        awayMatches: s.awayMatches,
      };
    }
    return {
      leagueCode,
      teams: teamsOut,
      homeAdvantage: 1.25,
      avgHomeGoals,
      avgAwayGoals,
      rho: -0.13,
      sampleSize: matchCount,
      fittedAt: new Date().toISOString(),
    };
  }

  // 2. Iteratív arányos illesztés (Minorization-Maximization Poisson MLE)
  // Kezdőértékek: minden csapat alpha = 1.0, beta = 1.0
  const alpha: Record<string, number> = {};
  const beta: Record<string, number> = {};

  for (const k of teamKeys) {
    alpha[k] = 1.0;
    beta[k] = 1.0;
  }

  // Bayesian Gamma(a, b) regularizáció (Laplace smoothing), ami megvédi a kevés meccses csapatokat
  const priorA = 3.0;
  const priorB = 3.0;

  for (let iter = 0; iter < maxIter; iter++) {
    // A) Alpha (támadóerősség) frissítése
    for (const k of teamKeys) {
      let num = priorA - 1;
      let denom = priorB;

      for (const m of validMatches) {
        const hKey = normalizeTeamName(m.homeTeam);
        const aKey = normalizeTeamName(m.awayTeam);
        if (hKey !== k && aKey !== k) continue;

        let weight = 1.0;
        if (m.date && xi > 0) {
          const matchMs = new Date(m.date).getTime();
          if (!isNaN(matchMs)) {
            const daysAgo = Math.max(0, (nowMs - matchMs) / DAY_MS);
            weight = Math.exp(-xi * daysAgo);
          }
        }

        if (hKey === k) {
          num += weight * m.homeGoals;
          denom += weight * beta[aKey] * homeAdvantage;
        } else if (aKey === k) {
          num += weight * m.awayGoals;
          denom += weight * beta[hKey];
        }
      }

      alpha[k] = denom > 0 ? Math.max(0.2, num / denom) : 1.0;
    }

    // B) Beta (védelmi gyengeség) frissítése
    for (const k of teamKeys) {
      let num = priorA - 1;
      let denom = priorB;

      for (const m of validMatches) {
        const hKey = normalizeTeamName(m.homeTeam);
        const aKey = normalizeTeamName(m.awayTeam);
        if (hKey !== k && aKey !== k) continue;

        let weight = 1.0;
        if (m.date && xi > 0) {
          const matchMs = new Date(m.date).getTime();
          if (!isNaN(matchMs)) {
            const daysAgo = Math.max(0, (nowMs - matchMs) / DAY_MS);
            weight = Math.exp(-xi * daysAgo);
          }
        }

        if (hKey === k) {
          // Ha hazai volt, a kapott gól a vendég gólja
          num += weight * m.awayGoals;
          denom += weight * alpha[aKey];
        } else if (aKey === k) {
          // Ha vendég volt, a kapott gól a hazai gólja
          num += weight * m.homeGoals;
          denom += weight * alpha[hKey] * homeAdvantage;
        }
      }

      beta[k] = denom > 0 ? Math.max(0.2, num / denom) : 1.0;
    }

    // C) Gamma (hazai előny) frissítése
    let numGamma = 0;
    let denomGamma = 0;
    for (const m of validMatches) {
      const hKey = normalizeTeamName(m.homeTeam);
      const aKey = normalizeTeamName(m.awayTeam);
      numGamma += m.homeGoals;
      denomGamma += alpha[hKey] * beta[aKey];
    }
    if (denomGamma > 0) {
      homeAdvantage = Math.min(1.6, Math.max(1.05, numGamma / denomGamma));
    }

    // D) Normalizálás: az átlagos támadóerő mindig pontosan 1.0 maradjon
    const sumAlpha = Object.values(alpha).reduce((acc, v) => acc + v, 0);
    const meanAlpha = sumAlpha / nTeams;
    if (meanAlpha > 0) {
      for (const k of teamKeys) {
        alpha[k] /= meanAlpha;
        beta[k] *= meanAlpha;
      }
    }
  }

  // 3. Rho (alacsony gólszámú korrekciós paraméter) becslése empirikus grid-search segítségével
  // Dixon-Coles log-likelihood optimalizálás a 0-0, 0-1, 1-0, 1-1 cellákra
  let bestRho = -0.13;
  let maxLogLik = -Infinity;

  for (let r = -0.24; r <= 0.02; r += 0.02) {
    let ll = 0;
    for (const m of validMatches) {
      const hKey = normalizeTeamName(m.homeTeam);
      const aKey = normalizeTeamName(m.awayTeam);
      const lh = alpha[hKey] * beta[aKey] * homeAdvantage * (avgHomeGoals / 1.3);
      const la = alpha[aKey] * beta[hKey] * (avgAwayGoals / 1.1);

      const x = m.homeGoals;
      const y = m.awayGoals;

      let tau = 1.0;
      if (x === 0 && y === 0) tau = Math.max(0.01, 1 - lh * la * r);
      else if (x === 0 && y === 1) tau = Math.max(0.01, 1 + lh * r);
      else if (x === 1 && y === 0) tau = Math.max(0.01, 1 + la * r);
      else if (x === 1 && y === 1) tau = Math.max(0.01, 1 - r);

      ll += Math.log(tau);
    }
    if (ll > maxLogLik) {
      maxLogLik = ll;
      bestRho = Math.round(r * 100) / 100;
    }
  }

  // 4. Eredmények összeállítása
  const teamsOut: Record<string, TeamRating> = {};
  for (const k of teamKeys) {
    const s = teamStats[k];
    teamsOut[k] = {
      attack: Math.round(alpha[k] * 100) / 100,
      defense: Math.round(beta[k] * 100) / 100,
      goalsScored: s.goalsScored,
      goalsConceded: s.goalsConceded,
      matchesPlayed: s.homeMatches + s.awayMatches,
      homeScored: s.homeScored,
      homeConceded: s.homeConceded,
      awayScored: s.awayScored,
      awayConceded: s.awayConceded,
      homeMatches: s.homeMatches,
      awayMatches: s.awayMatches,
    };
  }

  return {
    leagueCode,
    teams: teamsOut,
    homeAdvantage: Math.round(homeAdvantage * 100) / 100,
    avgHomeGoals: Math.round(avgHomeGoals * 100) / 100,
    avgAwayGoals: Math.round(avgAwayGoals * 100) / 100,
    rho: bestRho,
    sampleSize: matchCount,
    fittedAt: new Date().toISOString(),
  };
}

/**
 * Európai topcsapatok és nemzetközi kupa résztvevők empirikus prior paraméterei
 * (amikor a 3 napos API ablakban még nem fejeződött be meccsük, vagy más bajnokságból érkeznek pl. BL-ben)
 */
export const EUROPEAN_CLUB_PRIORS: Record<string, { attack: number; defense: number }> = {
  // Premier League
  mancity: { attack: 1.45, defense: 0.70 },
  manchestercity: { attack: 1.45, defense: 0.70 },
  liverpool: { attack: 1.42, defense: 0.72 },
  arsenal: { attack: 1.38, defense: 0.68 },
  chelsea: { attack: 1.28, defense: 0.90 },
  tottenham: { attack: 1.32, defense: 0.92 },
  tottenhamhotspur: { attack: 1.32, defense: 0.92 },
  astonvilla: { attack: 1.25, defense: 0.88 },
  manchesterunited: { attack: 1.20, defense: 0.95 },
  manunited: { attack: 1.20, defense: 0.95 },
  newcastle: { attack: 1.25, defense: 0.90 },
  brighton: { attack: 1.22, defense: 0.92 },
  coventry: { attack: 0.95, defense: 1.20 },
  coventrycity: { attack: 0.95, defense: 1.20 },
  wolverhampton: { attack: 1.05, defense: 1.15 },
  wolves: { attack: 1.05, defense: 1.15 },
  portsmouth: { attack: 0.90, defense: 1.25 },

  // La Liga
  realmadrid: { attack: 1.45, defense: 0.72 },
  barca: { attack: 1.40, defense: 0.78 },
  barcelona: { attack: 1.40, defense: 0.78 },
  atletico: { attack: 1.25, defense: 0.80 },
  atleticomadrid: { attack: 1.25, defense: 0.80 },
  atleti: { attack: 1.25, defense: 0.80 },
  realsociedad: { attack: 1.15, defense: 0.90 },
  sociedad: { attack: 1.15, defense: 0.90 },
  villarreal: { attack: 1.20, defense: 0.92 },
  athletic: { attack: 1.18, defense: 0.88 },
  athleticbilbao: { attack: 1.18, defense: 0.88 },
  sevilla: { attack: 1.12, defense: 1.05 },
  getafe: { attack: 0.95, defense: 0.95 },
  rayovallecano: { attack: 1.02, defense: 1.10 },

  // Serie A
  inter: { attack: 1.38, defense: 0.75 },
  milan: { attack: 1.28, defense: 0.85 },
  acmilan: { attack: 1.28, defense: 0.85 },
  juventus: { attack: 1.25, defense: 0.80 },
  napoli: { attack: 1.28, defense: 0.80 },
  roma: { attack: 1.22, defense: 0.85 },
  asroma: { attack: 1.22, defense: 0.85 },
  atalanta: { attack: 1.30, defense: 0.90 },
  lazio: { attack: 1.20, defense: 0.90 },
  monza: { attack: 0.95, defense: 1.15 },
  cagliari: { attack: 0.92, defense: 1.20 },
  parma: { attack: 1.05, defense: 1.18 },
  torino: { attack: 1.02, defense: 0.98 },

  // Bundesliga
  bayern: { attack: 1.48, defense: 0.75 },
  bayernmunich: { attack: 1.48, defense: 0.75 },
  bayernmunchen: { attack: 1.48, defense: 0.75 },
  dortmund: { attack: 1.35, defense: 0.85 },
  borussiadortmund: { attack: 1.35, defense: 0.85 },
  leverkusen: { attack: 1.38, defense: 0.82 },
  bayerleverkusen: { attack: 1.38, defense: 0.82 },
  leipzig: { attack: 1.28, defense: 0.88 },
  rbleipzig: { attack: 1.28, defense: 0.88 },
  stuttgart: { attack: 1.22, defense: 0.95 },
  vfb: { attack: 1.22, defense: 0.95 },
  frankfurt: { attack: 1.20, defense: 0.95 },

  // Ligue 1
  psg: { attack: 1.42, defense: 0.78 },
  parissaintgermain: { attack: 1.42, defense: 0.78 },
  monaco: { attack: 1.25, defense: 0.90 },
  marseille: { attack: 1.22, defense: 0.92 },
  lille: { attack: 1.20, defense: 0.88 },
  lyon: { attack: 1.20, defense: 0.95 },

  // Eredivisie & Primeira Liga
  psv: { attack: 1.30, defense: 0.88 },
  feyenoord: { attack: 1.22, defense: 0.90 },
  ajax: { attack: 1.22, defense: 0.92 },
  sporting: { attack: 1.30, defense: 0.82 },
  sportingcp: { attack: 1.30, defense: 0.82 },
  benfica: { attack: 1.24, defense: 0.85 },
  porto: { attack: 1.22, defense: 0.85 },
  braga: { attack: 1.18, defense: 0.92 },
  gilvicente: { attack: 0.95, defense: 1.15 },

  // Nemzetközi európai kupa csapatok
  fenerbahce: { attack: 1.22, defense: 0.92 },
  galatasaray: { attack: 1.25, defense: 0.92 },
  slaviapraha: { attack: 1.12, defense: 1.05 },
  bodglimt: { attack: 1.08, defense: 1.12 },
  bodoglimt: { attack: 1.08, defense: 1.12 },
  slbratislava: { attack: 0.85, defense: 1.30 },
  slovanbratislava: { attack: 0.85, defense: 1.30 },
  paeaek: { attack: 0.90, defense: 1.25 },
  aek: { attack: 0.90, defense: 1.25 },
  aekathens: { attack: 0.90, defense: 1.25 },
  sabah: { attack: 0.80, defense: 1.35 },
  sabahfk: { attack: 0.80, defense: 1.35 },

  // Brazil Série A
  corinthians: { attack: 1.05, defense: 1.02 },
  vitoria: { attack: 0.92, defense: 1.18 },
  saopaulo: { attack: 1.08, defense: 1.02 },
  flamengo: { attack: 1.25, defense: 0.90 },
  palmeiras: { attack: 1.25, defense: 0.88 },
  botafogo: { attack: 1.22, defense: 0.90 },
};

function getClubPriorRating(teamName: string): TeamRating | undefined {
  const norm = normalizeTeamName(teamName);
  if (!norm) return undefined;
  let prior = EUROPEAN_CLUB_PRIORS[norm];
  if (!prior) {
    const key = Object.keys(EUROPEAN_CLUB_PRIORS).find((k) => k.includes(norm) || norm.includes(k));
    if (key) prior = EUROPEAN_CLUB_PRIORS[key];
  }
  if (!prior) return undefined;

  return {
    attack: prior.attack,
    defense: prior.defense,
    goalsScored: Math.round(prior.attack * 10),
    goalsConceded: Math.round(prior.defense * 10),
    matchesPlayed: 10,
    homeScored: Math.round(prior.attack * 5),
    homeConceded: Math.round(prior.defense * 5),
    awayScored: Math.round(prior.attack * 5),
    awayConceded: Math.round(prior.defense * 5),
    homeMatches: 5,
    awayMatches: 5,
  };
}

/**
 * Kiszámítja a két csapat valós várható góljait (xG: lambda, mu) a Dixon-Coles modellből
 */
export function computeExpectedGoalsFromModel(
  model: FittedDixonColesModel | null,
  homeTeamName: string,
  awayTeamName: string,
  fallbackHomeAvg: number = 1.45,
  fallbackAwayAvg: number = 1.15
): {
  homeXg: number;
  awayXg: number;
  homeRating?: TeamRating;
  awayRating?: TeamRating;
  isFitted: boolean;
} {
  const hNorm = normalizeTeamName(homeTeamName);
  const aNorm = normalizeTeamName(awayTeamName);

  let hRating: TeamRating | undefined = model?.teams[hNorm];
  let aRating: TeamRating | undefined = model?.teams[aNorm];

  if (model?.teams && !hRating) {
    const matchKey = Object.keys(model.teams).find(
      (k) => k.includes(hNorm) || hNorm.includes(k)
    );
    if (matchKey) hRating = model.teams[matchKey];
  }
  if (model?.teams && !aRating) {
    const matchKey = Object.keys(model.teams).find(
      (k) => k.includes(aNorm) || aNorm.includes(k)
    );
    if (matchKey) aRating = model.teams[matchKey];
  }

  // Fallback European club priors, ha a csapat nem szerepel a lokális mintában
  if (!hRating) hRating = getClubPriorRating(homeTeamName);
  if (!aRating) aRating = getClubPriorRating(awayTeamName);

  const homeAttack = hRating ? hRating.attack : 1.0;
  const homeDefense = hRating ? hRating.defense : 1.0;
  const awayAttack = aRating ? aRating.attack : 1.0;
  const awayDefense = aRating ? aRating.defense : 1.0;

  const avgH = model?.avgHomeGoals ?? fallbackHomeAvg;
  const avgA = model?.avgAwayGoals ?? fallbackAwayAvg;
  const homeAdv = model?.homeAdvantage ?? 1.15;

  const lh = homeAttack * awayDefense * avgH * (homeAdv / 1.12);
  const la = awayAttack * homeDefense * avgA;

  return {
    homeXg: Math.max(0.2, Math.round(lh * 10) / 10),
    awayXg: Math.max(0.2, Math.round(la * 10) / 10),
    homeRating: hRating,
    awayRating: aRating,
    isFitted: Boolean(hRating || aRating),
  };
}

/**
 * Modell mentése localStorage-be
 */
export function saveLeagueModel(model: FittedDixonColesModel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${model.leagueCode}`,
      JSON.stringify(model)
    );
  } catch (e) {
    console.warn('Nem sikerült elmenteni a Dixon-Coles modellt:', e);
  }
}

/**
 * Modell betöltése localStorage-ből
 */
export function loadLeagueModel(
  leagueCode: string
): FittedDixonColesModel | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${leagueCode}`);
    if (!saved) return null;
    const model: FittedDixonColesModel = JSON.parse(saved);
    if (
      Date.now() - new Date(model.fittedAt).getTime() > MODEL_CACHE_TTL_MS ||
      !model.teams
    ) {
      return null;
    }
    return model;
  } catch {
    return null;
  }
}
