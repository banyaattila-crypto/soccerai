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

import { dixonColesTau, computeDixonColesExpectedGoals } from './predictionEngine';
import { normalizeTeamName } from '../utils/teamUtils';
export { normalizeTeamName };

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

// v2: az új (μ-alapú, egységes skálájú) illesztés. A v1 modellek 3 napos ablakból készültek, ezeket nem használjuk tovább.
const STORAGE_PREFIX = 'soccerai_dc_model_v2_';
const PRIOR_STRENGTH = 5; // pszeudo-megfigyelés (várható gól egységben); a valós backtest (5 liga, tune 2024/25) K≈4-6 mellett adta a legjobb log-loss-t
const GAMMA_MIN = 1.05;
const GAMMA_MAX = 1.7;
const MU_MIN = 0.3;
const MU_MAX = 3.0;
const RHO_PRIOR = -0.1;
const RHO_PRIOR_MATCHES = 300;
const MODEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 órás gyorsítótár

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
  xi: number = 0.0015,
  maxIter: number = 35,
  /** Az "ma" időpontja az időlecsengéshez (ms). Backtestnél a predikció dátuma, hogy ne legyen előretekintés. */
  asOfMs: number = Date.now(),
  /** A csapaterősség 1,0 felé húzásának erőssége (pszeudo-megfigyelés); backtestnél hangolható */
  priorStrength: number = PRIOR_STRENGTH
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

  const nowMs = asOfMs;
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

  // 2. Iteratív illesztés (koordinátánkénti Poisson-MLE, MM-frissítések)
  //
  //    λ_hazai  = μ · γ · α_i · β_j
  //    λ_vendég = μ · α_j · β_i
  //
  //    α (támadás) és β (védelmi gyengeség) átlaga mindig 1,0; a liga gólszintje (μ) és a hazai
  //    előny (γ) külön paraméter. Ez a konvenció egyezik a predikciós képlettel
  //    (computeDixonColesExpectedGoals) és az EUROPEAN_CLUB_PRIORS értékeivel, így nincs dupla skálázás.
  const alpha: Record<string, number> = {};
  const beta: Record<string, number> = {};
  for (const k of teamKeys) {
    alpha[k] = 1.0;
    beta[k] = 1.0;
  }

  let mu = Math.min(MU_MAX, Math.max(MU_MIN, avgAwayGoals));
  let gamma = Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, homeAdvantage));

  // Mérkőzések időbeli súlyainak (xi) és normalizált csapatneveinek egyszeri előkalkulációja
  const weightedMatches = validMatches.map((m) => {
    let weight = 1.0;
    if (m.date && xi > 0) {
      const matchMs = new Date(m.date).getTime();
      if (!isNaN(matchMs)) {
        const daysAgo = Math.max(0, (nowMs - matchMs) / DAY_MS);
        weight = Math.exp(-xi * daysAgo);
      }
    }
    return {
      homeKey: normalizeTeamName(m.homeTeam),
      awayKey: normalizeTeamName(m.awayTeam),
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      weight,
    };
  });

  // Bayes-regularizáció: PRIOR_STRENGTH várható gólnyi pszeudo-megfigyelés 1,0 körül.
  // A (tapasztalati arány) = (gól + K) / (várható gól-expozíció + K), így adat nélkül pontosan 1,0.
  for (let iter = 0; iter < maxIter; iter++) {
    // A) Alpha (támadóerősség)
    for (const k of teamKeys) {
      let num = priorStrength;
      let denom = priorStrength;
      for (const m of weightedMatches) {
        if (m.homeKey === k) {
          num += m.weight * m.homeGoals;
          denom += m.weight * mu * gamma * beta[m.awayKey];
        } else if (m.awayKey === k) {
          num += m.weight * m.awayGoals;
          denom += m.weight * mu * beta[m.homeKey];
        }
      }
      alpha[k] = Math.max(0.2, num / denom);
    }

    // B) Beta (védelmi gyengeség)
    for (const k of teamKeys) {
      let num = priorStrength;
      let denom = priorStrength;
      for (const m of weightedMatches) {
        if (m.homeKey === k) {
          // Hazaiként a kapott gól a vendég gólja
          num += m.weight * m.awayGoals;
          denom += m.weight * mu * alpha[m.awayKey];
        } else if (m.awayKey === k) {
          num += m.weight * m.homeGoals;
          denom += m.weight * mu * gamma * alpha[m.homeKey];
        }
      }
      beta[k] = Math.max(0.2, num / denom);
    }

    // C) Liga gólszintje (μ) és hazai előny (γ), azonos időbeli súlyozással
    let sumHome = 0;
    let sumAway = 0;
    let expHomeBase = 0;
    let expAwayBase = 0;
    for (const m of weightedMatches) {
      sumHome += m.weight * m.homeGoals;
      sumAway += m.weight * m.awayGoals;
      expHomeBase += m.weight * alpha[m.homeKey] * beta[m.awayKey];
      expAwayBase += m.weight * alpha[m.awayKey] * beta[m.homeKey];
    }
    if (expAwayBase > 0 && sumAway > 0) {
      mu = Math.min(MU_MAX, Math.max(MU_MIN, sumAway / expAwayBase));
    }
    if (expHomeBase > 0 && sumHome > 0) {
      gamma = Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, sumHome / (mu * expHomeBase)));
    }

    // D) Normalizálás: α és β átlaga 1,0; a skála átkerül μ-be (a λ-k nem változnak)
    const meanAlpha = Object.values(alpha).reduce((acc, v) => acc + v, 0) / nTeams;
    const meanBeta = Object.values(beta).reduce((acc, v) => acc + v, 0) / nTeams;
    if (meanAlpha > 0 && meanBeta > 0) {
      for (const k of teamKeys) {
        alpha[k] /= meanAlpha;
        beta[k] /= meanBeta;
      }
      mu *= meanAlpha * meanBeta;
    }
  }
  homeAdvantage = gamma;

  // 3. Rho (alacsony gólszámú korrekciós paraméter) becslése empirikus grid-search segítségével.
  // Adott λ-k mellett a Poisson-tagok nem függnek ρ-tól, ezért elég a τ-faktorok súlyozott log-likelihoodja.
  let bestRho = -0.13;
  let maxLogLik = -Infinity;

  for (let r = -0.24; r <= 0.02 + 1e-9; r += 0.02) {
    let ll = 0;
    for (const m of weightedMatches) {
      const { lh, la } = computeDixonColesExpectedGoals({
        attackHome: alpha[m.homeKey],
        defenseHome: beta[m.homeKey],
        attackAway: alpha[m.awayKey],
        defenseAway: beta[m.awayKey],
        avgAwayGoals: mu,
        homeAdvantage: gamma,
      });
      ll += m.weight * Math.log(dixonColesTau(m.homeGoals, m.awayGoals, lh, la, r));
    }
    if (ll > maxLogLik) {
      maxLogLik = ll;
      bestRho = Math.round(r * 100) / 100 + 0; // +0: a −0 kiküszöbölése
    }
  }

  // 4. Eredmények összeállítása
  const teamsOut: Record<string, TeamRating> = {};
  for (const k of teamKeys) {
    const s = teamStats[k];
    teamsOut[k] = {
      attack: Math.round(alpha[k] * 1000) / 1000,
      defense: Math.round(beta[k] * 1000) / 1000,
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
    homeAdvantage: Math.round(homeAdvantage * 1000) / 1000,
    // μ (a vendég alapszint) és μ·γ: a predikciós képlet ezekkel egységes
    avgHomeGoals: Math.round(mu * homeAdvantage * 1000) / 1000,
    avgAwayGoals: Math.round(mu * 1000) / 1000,
    // ρ becslése zajos (±0,05 még 380 meccsnél is): kis mintán a tipikus −0,10 felé húzzuk
    rho: Math.round(((matchCount * bestRho + RHO_PRIOR_MATCHES * RHO_PRIOR) / (matchCount + RHO_PRIOR_MATCHES)) * 100) / 100 + 0,
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

const PRIOR_BLEND_MATCHES = 12;

/**
 * Kis mintájú modell-rating keverése a kézi klub-priorral (ha van prior).
 */
function blendWithClubPrior(rating: TeamRating | undefined, teamName: string): TeamRating | undefined {
  if (!rating) return rating;
  const prior = getClubPriorRating(teamName);
  if (!prior) return rating;
  const n = rating.matchesPlayed;
  const w = n / (n + PRIOR_BLEND_MATCHES);
  return {
    ...rating,
    attack: Math.round((w * rating.attack + (1 - w) * prior.attack) * 1000) / 1000,
    defense: Math.round((w * rating.defense + (1 - w) * prior.defense) * 1000) / 1000,
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
  fallbackAwayAvg: number = 1.15,
  /** false: a kézi klub-priorok kikapcsolva (backtestnél, mert a mai priorok a múltra előretekintést jelentenének) */
  usePriors: boolean = true
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

  // Az illesztett rating tényleges forrása: modell-e, vagy csak a kézi klub-prior
  const fromModel = Boolean(hRating || aRating);

  // Ha a csapat mintája kicsi (pl. nemzetközi kupa), a kézi klub-priorral keverjük:
  // súly = n / (n + PRIOR_BLEND_MATCHES). Prior nélküli csapatnál a modell-érték marad.
  if (usePriors) hRating = blendWithClubPrior(hRating, homeTeamName);
  if (usePriors) aRating = blendWithClubPrior(aRating, awayTeamName);

  // Fallback: kézi klub-prior, ha a csapat nem szerepel a modellben
  if (usePriors && !hRating) hRating = getClubPriorRating(homeTeamName);
  if (usePriors && !aRating) aRating = getClubPriorRating(awayTeamName);

  const homeAttack = hRating ? hRating.attack : 1.0;
  const homeDefense = hRating ? hRating.defense : 1.0;
  const awayAttack = aRating ? aRating.attack : 1.0;
  const awayDefense = aRating ? aRating.defense : 1.0;

  const avgH = model?.avgHomeGoals ?? fallbackHomeAvg;
  const avgA = model?.avgAwayGoals ?? fallbackAwayAvg;
  // Modell nélkül a hazai előny a fallback átlagokból adódik (nem fix 1,15, ami az avgH-t felülírná)
  const homeAdv = model?.homeAdvantage ?? fallbackHomeAvg / Math.max(0.5, fallbackAwayAvg);

  // Egységesített Dixon-Coles várható gól képlet
  const { lh, la } = computeDixonColesExpectedGoals({
    attackHome: homeAttack,
    defenseHome: homeDefense,
    attackAway: awayAttack,
    defenseAway: awayDefense,
    avgHomeGoals: avgH,
    avgAwayGoals: avgA,
    homeAdvantage: homeAdv,
  });

  return {
    homeXg: Math.max(0.2, Math.round(lh * 100) / 100),
    awayXg: Math.max(0.2, Math.round(la * 100) / 100),
    homeRating: hRating,
    awayRating: aRating,
    // Csak akkor "illesztett", ha legalább az egyik csapat értéke a modellből jön, nem csupán a kézi priorból
    isFitted: fromModel,
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
