import { Match, PickMarket } from '../types/football';

export interface MatchExplanationKeyFactor {
  icon: 'trend' | 'goal' | 'target' | 'shield';
  title: string;
  description: string;
}

export interface MatchExplanationRisk {
  level: 'Alacsony' | 'Közepes' | 'Magas';
  label: string;
  description: string;
}

export interface MatchExplanation {
  headline: string;
  summary: string;
  teamDynamics: string;
  goalExpectation: string;
  pickRationale: string;
  riskAssessment: MatchExplanationRisk;
  keyFactors: MatchExplanationKeyFactor[];
}

/**
 * Számítja a forma pontszámát az utolsó meccsekből (W=3, D=1, L=0).
 */
function getFormSummary(form?: ('W' | 'D' | 'L')[]): { wins: number; draws: number; losses: number; text: string } {
  if (!form || form.length === 0) {
    return { wins: 0, draws: 0, losses: 0, text: 'Nincs elérhető közvetlen formaadat' };
  }
  let wins = 0;
  let draws = 0;
  let losses = 0;
  form.forEach((f) => {
    if (f === 'W') wins++;
    else if (f === 'D') draws++;
    else if (f === 'L') losses++;
  });
  return {
    wins,
    draws,
    losses,
    text: `${form.length} meccsből ${wins} győzelem, ${draws} döntetlen, ${losses} vereség`,
  };
}

/**
 * Normalizálja a piac típusát a magyarázat generálásához.
 */
function normalizeMarket(market?: PickMarket | string): string {
  if (!market) return '1';
  switch (market) {
    case '1':
    case 'HOME_WIN':
      return '1';
    case '2':
    case 'AWAY_WIN':
      return '2';
    case 'X':
    case 'DRAW':
      return 'X';
    case 'BTTS':
    case 'BTTS_YES':
      return 'BTTS';
    case 'BTTS_NO':
      return 'BTTS_NO';
    case 'OVER_25':
      return 'OVER_25';
    case 'UNDER_25':
      return 'UNDER_25';
    case 'OVER_15':
      return 'OVER_15';
    case 'UNDER_15':
      return 'UNDER_15';
    case 'OVER_35':
      return 'OVER_35';
    case 'UNDER_35':
      return 'UNDER_35';
    case 'FH_OVER_05':
      return 'FH_OVER_05';
    case 'BTTS_AND_OVER25':
      return 'BTTS_AND_OVER25';
    default:
      return market;
  }
}

/**
 * Gazdag, szakértői magyar nyelvű meccs magyarázatot állít elő
 * egy adott mérkőzéshez a statisztikák, forma, xG és a kvantitatív modell alapján.
 */
export function generateMatchExplanation(match: Match): MatchExplanation {
  const homeName = match.homeTeam.name;
  const awayName = match.awayTeam.name;
  const homeShort = match.homeTeam.shortName || homeName;
  const awayShort = match.awayTeam.shortName || awayName;

  const p = match.probabilities;
  const homeWinP = p.homeWin ?? 45;
  const drawP = p.draw ?? 27;
  const awayWinP = p.awayWin ?? 28;
  const over25P = p.over25 ?? 50;
  const under25P = 100 - over25P;
  const bttsP = p.bttsYes ?? 50;
  const fhOver05P = p.fhOver05 ?? 65;

  // xG és gólbecslések
  const dc = match.quantAnalysis?.dixonColesRatings;
  const homeXg = match.homeTeam.xgAvg ?? (dc ? dc.homeAttack * (dc.homeAdvantage || 1.2) : 1.45);
  const awayXg = match.awayTeam.xgAvg ?? (dc ? dc.awayAttack : 1.15);
  const totalExpectedGoals = Math.round((homeXg + awayXg) * 10) / 10;

  // Forma és helyezések
  const homeRank = match.homeTeam.rank;
  const awayRank = match.awayTeam.rank;
  const homeForm = getFormSummary(match.homeTeam.form);
  const awayForm = getFormSummary(match.awayTeam.form);

  const activeMarket = normalizeMarket(match.aiPick?.market);
  const pickOdds = match.aiPick?.odds ?? match.odds.home;
  const pickProb = match.aiPick?.probability ?? homeWinP;
  const pickLabel = match.aiPick?.marketLabel ?? `${homeShort} Győzelem (1)`;

  // 1. Címsor (Headline)
  let headline = '';
  if (activeMarket === 'BTTS_AND_OVER25' || (over25P >= 58 && bttsP >= 55)) {
    headline = `${homeName} – ${awayName}: Nyílt sisakos összecsapás, kiemelkedő gólvárakozással`;
  } else if (activeMarket === 'UNDER_25' || over25P <= 42 || totalExpectedGoals < 2.2) {
    headline = `${homeName} – ${awayName}: Fegyelmezett, taktikus csata a védelmek dominanciájával`;
  } else if (homeWinP >= 55) {
    headline = `${homeName} egyértelmű hazai fölényben várja a ${awayName} elleni találkozót`;
  } else if (awayWinP >= 48) {
    headline = `${awayName} esélyesebbként, minőségi játékerővel látogat a ${homeName} otthonába`;
  } else if (Math.abs(homeWinP - awayWinP) <= 10) {
    headline = `${homeName} – ${awayName}: Kiélezett, kiegyenlített rangadó a riválisok között`;
  } else {
    headline = `${homeName} – ${awayName}: Taktikai erőpróba a bajnoki pontokért`;
  }

  // 2. Átfogó Összefoglaló (Summary)
  let summary = '';
  if (homeWinP >= 55) {
    summary = `A mérkőzés esélyese a hazai pályán fellépő ${homeName}, amely a statisztikai modellek alapján ${homeWinP}%-os valószínűséggel tarthatja otthon a három pontot. A hazai pálya faktora és a hatékonyabb helyzetkihasználás a vendégek felé billenti a mérleg nyelvét, miközben a ${awayName} csapatának kontrákra kell berendezkednie.`;
  } else if (awayWinP >= 48) {
    summary = `Noha a ${homeName} játszik saját közönsége előtt, a játékoskeret minősége és a közelmúltbeli mutatók alapján a vendég ${awayName} számít esélyesebbnek (${awayWinP}% győzelmi esély). Amennyiben a vendégek rá tudják erőltetni akaratukat a hazaiakra, jó eséllyel megszerzik a győzelmet.`;
  } else {
    summary = `Kifejezetten szoros és kétesélyes mérkőzés előtt állunk: a modell szerint a ${homeName} (${homeWinP}%) és a ${awayName} (${awayWinP}%) közel azonos játékerőt képvisel, miközben a döntetlen esélye is számottevő (${drawP}%). Ebben a párharcban az apró taktikai nüanszok és az egyéni villanások dönthetnek.`;
  }

  // 3. Csapatdinamika és Forma (Team Dynamics)
  let teamDynamics = '';
  const homeRankText = homeRank ? `a tabella ${homeRank}. helyezettjeként` : 'hazai környezetben';
  const awayRankText = awayRank ? `a rangsor ${awayRank}. helyéről` : 'vendégként';

  teamDynamics = `${homeName} ${homeRankText} lép pályára, közelmúltbeli mérlege: ${homeForm.text}. Ezzel szemben a ${awayName} ${awayRankText} érkezik (${awayForm.text}). `;

  if (match.h2h && match.h2h.length > 0) {
    const totalH2h = match.h2h.length;
    let hWins = 0;
    let aWins = 0;
    let dCount = 0;
    match.h2h.forEach((h) => {
      if (h.homeScore > h.awayScore) hWins++;
      else if (h.awayScore > h.homeScore) aWins++;
      else dCount++;
    });
    teamDynamics += `Az utolsó ${totalH2h} egymás elleni találkozón ${hWins} hazai siker, ${dCount} döntetlen és ${aWins} vendég győzelem született, ami igazolja a párharc múltbéli ritmusát.`;
  } else {
    teamDynamics += `A felek korábbi mérkőzései és jelenlegi játékstílusa alapján a középpályás labdabirtoklás és a védelmi stabilitás lesz a legfőbb ütközőpont.`;
  }

  // 4. Góldinamika & Taktikai Várakozás (Goal Expectation)
  let goalExpectation = '';
  if (totalExpectedGoals >= 2.85 || over25P >= 58) {
    goalExpectation = `A matematikai gólmodell összetett gólvárakozása ${totalExpectedGoals.toFixed(1)} xG (${homeShort}: ${homeXg.toFixed(1)} xG, ${awayShort}: ${awayXg.toFixed(1)} xG). Mindkét együttes nyílt felfogásban futballozik, a védekező zónák mögött gyakran nyílik terület. A 2.5 gól feletti kimenetel esélye ${over25P}%, a mindkét csapat szerez gólt (BTTS) valószínűsége pedig ${bttsP}%, ami élvezetes, gólgazdag összecsapást ígér.`;
  } else if (totalExpectedGoals <= 2.2 || under25P >= 58) {
    goalExpectation = `A várható gólok száma visszafogott, mindössze ${totalExpectedGoals.toFixed(1)} xG összetett szinten (${homeShort}: ${homeXg.toFixed(1)}, ${awayShort}: ${awayXg.toFixed(1)}). A csapatok fegyelmezett pozíciós játékot játszanak, kevés engedett ziccerrel. A modell ${under25P}%-os valószínűséget rendel a 2.5 gól alatti eredményhez, a legvalószínűbb végeredmények a Poisson-mátrix szerint a 0-0, 1-0 vagy 1-1.`;
  } else {
    goalExpectation = `Kiegyensúlyozott gólprofil figyelhető meg: az elvárt gólok száma ${totalExpectedGoals.toFixed(1)} xG környékén mozog. Mindkét fél képes veszélyes támadásokat vezetni, de a szervezett védelmek miatt a 2-3 gólos sáv tűnik a legreálisabb forgatókönyvnek. Az első félidőben legalább egy találat születésére ${fhOver05P}% az esély.`;
  }

  // 5. Kiemelt Tipp Részletes Indoklása (Pick Rationale)
  let pickRationale = '';
  switch (activeMarket) {
    case '1':
      pickRationale = `A rendszer a hazai győzelmet (${pickLabel}) jelöli meg a legértékesebb opcióként. A modell ${pickProb}%-os hazai győzelmi esélyt kalkulált, amihez a piacon kínált ${pickOdds.toFixed(2)}-es szorzó szilárd pozitív várható értéket képvisel. A ${homeShort} hazai pályán magasabb intenzitással játszik és stabilabb xG mutatókkal rendelkezik.`;
      break;

    case '2':
      pickRationale = `A kiemelt tipp a vendéggyőzelem (${pickLabel}). A modell ${pickProb}% valószínűséget állapított meg a ${awayShort} javára, ami a ${pickOdds.toFixed(2)}-es odds mellett kiemelkedő értéket nyújt. A vendégcsapat hatékonyabb támadóegysége és formája felülmúlja a hazai pályaelőnyt.`;
      break;

    case 'X':
      pickRationale = `A modell döntetlent (${pickLabel}) javasol. A két fél statisztikai mutatói és védelmi hatékonysága annyira szorosan korrelál (${drawP}% döntetlen valószínűség), hogy a magas piaci odds (${pickOdds.toFixed(2)}) mellett a pontosztozkodás kínálja a legkedvezőbb aszimmetrikus megtérülést.`;
      break;

    case 'BTTS':
      pickRationale = `A rendszer a „Mindkét csapat szerez gólt” (${pickLabel}) piacot preferálja. A ${bttsP}%-os modellvalószínűség mellett a csapatok támadópotenciálja (${totalExpectedGoals.toFixed(1)} várható gól) és a kapott gólok gyakorisága miatt mindkét oldal betalálása valószínűsíthető ${pickOdds.toFixed(2)}-es szorzón.`;
      break;

    case 'BTTS_NO':
      pickRationale = `A kiemelt választás: legalább az egyik fél nem szerez gólt (${pickLabel}). A védekező taktika és az alacsony várható xG (${totalExpectedGoals.toFixed(1)}) miatt a kapott gól nélküli mérkőzés valószínűsége meghaladja a piaci várakozásokat.`;
      break;

    case 'OVER_25':
      pickRationale = `A választott tipp a 2.5 gól feletti kimenetel (${pickLabel}). A modell által becsült ${totalExpectedGoals.toFixed(1)} összetett xG és a ${over25P}%-os valószínűség a mérkőzés korai szakaszában kialakuló helyzeteket és gólváltásokat vetíti előre a ${pickOdds.toFixed(2)}-es oddson.`;
      break;

    case 'UNDER_25':
      pickRationale = `A mérkőzés kiemelt tippje a 2.5 gól alatti kimenetel (${pickLabel}). A két együttes stabil védekezése, alacsony engedett xG-je és a lassabb tempójú játékstílus miatt a modell ${under25P}%-os valószínűséggel legfeljebb 2 gólt vár (${pickOdds.toFixed(2)} odds).`;
      break;

    case 'BTTS_AND_OVER25':
      pickRationale = `A legkiemelkedőbb kombinált tipp a „Mindkét csapat szerez gólt és 2.5 gól felett” (${pickLabel}). A Poisson-eloszlás és a Dixon-Coles gólmátrix alapján mindkét együttes betalálása és a legalább 3 gólos végeredmény együttes valószínűsége kifejezetten vonzó értéket képvisel a ${pickOdds.toFixed(2)}-es oddson.`;
      break;

    case 'OVER_15':
      pickRationale = `A legbiztonságosabb értékválasztás az 1.5 gól feletti kimenetel (${pickLabel}). A modell ${match.probabilities.over15}%-os esélyt lát legalább 2 találatra, ami alacsony volatilitás mellett biztosít stabil támaszt.`;
      break;

    case 'FH_OVER_05':
      pickRationale = `A kiemelt tipp az első félidőben szerzett gól (0.5 felett, ${pickLabel}). A modell korai magas labdabirtoklási nyomást és ${fhOver05P}%-os első félidei gólvalószínűséget jelez.`;
      break;

    default:
      pickRationale = `A kiemelt piac: ${pickLabel} (${pickOdds.toFixed(2)} odds, ${pickProb}% valószínűség). A többváltozós kvantitatív szűrő ezen a piacon mutatta ki a legstabilabb matematikai élt a bukmékeri konszenzussal szemben.`;
      break;
  }

  // 6. Kockázatelemzés (Risk Assessment)
  const qRisk = match.quantAnalysis?.riskLevel || (homeWinP > 60 || awayWinP > 60 ? 'Alacsony' : 'Közepes');
  let riskLabel = '';
  let riskDescription = '';

  if (qRisk === 'Alacsony') {
    riskLabel = 'Alacsony kockázatú mérkőzés';
    riskDescription = 'A statisztikai mutatók, a Dixon–Coles robusztussági szűrők és a csapatok stabilitása összhangban vannak a választott tippel. Alacsony szórás várható.';
  } else if (qRisk === 'Magas') {
    riskLabel = 'Magas volatilitású összecsapás';
    riskDescription = 'Kiszámíthatatlanabb formájú együttesek vagy magas piaci bizonytalanság. Ajánlott a megfontolt, konzervatív bankroll-tétkezelés.';
  } else {
    riskLabel = 'Mérsékelt, kiegyensúlyozott kockázat';
    riskDescription = 'A papírforma reális esélyeket mutat, ám a taktikai váratlanok (pl. korai büntető, kiállítás) befolyásolhatják a végeredményt.';
  }

  // 7. Strukturált Kulcstényezők (Key Factors)
  const keyFactors: MatchExplanationKeyFactor[] = [
    {
      icon: 'trend',
      title: 'Erőviszony & Formaindex',
      description:
        homeWinP >= awayWinP + 10
          ? `${homeShort} dominál (${homeWinP}% vs ${awayWinP}%), a hazai pálya jelentős támasz.`
          : awayWinP >= homeWinP + 10
          ? `${awayShort} esélyesebb (${awayWinP}% vs ${homeWinP}%), jobb vendégmutatókkal.`
          : `Kiegyenlített esélyek (${homeWinP}% - ${drawP}% - ${awayWinP}%), szoros rangadó.`,
    },
    {
      icon: 'goal',
      title: 'Gólprofil & Tempó',
      description:
        totalExpectedGoals >= 2.8
          ? `Magas tempójú meccs, ${totalExpectedGoals.toFixed(1)} összetett xG, nyílt védekezésekkel.`
          : totalExpectedGoals <= 2.2
          ? `Taktikus, zárt mérkőzés, ${totalExpectedGoals.toFixed(1)} várható góllal, szigorú védelmekkel.`
          : `Átlagos gólvárakozás (${totalExpectedGoals.toFixed(1)} xG), 2-3 gól közötti tartományban.`,
    },
    {
      icon: 'target',
      title: 'Fogadási Fókusz',
      description: `${pickLabel} (${pickOdds.toFixed(2)} odds) – ${pickProb}% modellvalószínűség mellett az optimális piaci választás.`,
    },
    {
      icon: 'shield',
      title: 'Taktikai Megjegyzés',
      description:
        fhOver05P >= 70
          ? `Gólra törő első félidő valószínű (${fhOver05P}% eséllyel lesz korai gól), ami felgyorsíthatja a játékot.`
          : `Visszafogott kezdés várható, mindkét fél a biztonságra törekedhet az első félidőben.`,
    },
  ];

  return {
    headline,
    summary,
    teamDynamics,
    goalExpectation,
    pickRationale,
    riskAssessment: {
      level: qRisk,
      label: riskLabel,
      description: riskDescription,
    },
    keyFactors,
  };
}
