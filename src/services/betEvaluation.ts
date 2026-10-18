import { PickMarket } from '../types/football';

export type MarketCategory = '1X2' | 'BTTS' | 'OVER_25' | 'UNDER_25' | 'COMBINED' | 'ALL';

/**
 * Piac besorolása kategóriába a szűréshez és a statisztikai elemzéshez
 */
export function getMarketCategory(market?: string, marketLabel?: string): MarketCategory {
  const m = (market || '').trim().toUpperCase();
  const l = (marketLabel || '').trim().toLowerCase();

  if (m === 'BTTS_AND_OVER25' || (l.includes('btts') && (l.includes('2.5') || l.includes('over') || l.includes('felett')))) {
    return 'COMBINED';
  }
  if (m === 'BTTS' || m === 'BTTS_YES' || m === 'BTTS_NO' || l.includes('btts') || l.includes('mindkét')) {
    return 'BTTS';
  }
  if (m === 'OVER_25' || l.includes('2.5 gól felett') || l.includes('2.5 felett') || l.includes('>2.5') || l.includes('> 2.5')) {
    return 'OVER_25';
  }
  if (m === 'UNDER_25' || l.includes('2.5 gól alatt') || l.includes('2.5 alatt') || l.includes('<2.5') || l.includes('< 2.5')) {
    return 'UNDER_25';
  }
  if (
    ['1', 'X', '2', 'HOME_WIN', 'DRAW', 'AWAY_WIN'].includes(m) ||
    /\([1x2]\)$/i.test(l) ||
    l.includes('győzelem') ||
    l.includes('döntetlen') ||
    /^(1\b|2\b|x\b|hazai\b|vendég\b)/i.test(l)
  ) {
    return '1X2';
  }
  return 'ALL';
}

/**
 * Valós matematikai eredmény-kiértékelő függvény a tényleges gólok és a piac alapján.
 *
 * @param homeScore Rendes játékidő hazai gólok
 * @param awayScore Rendes játékidő vendég gólok
 * @param market Piac azonosító kódja (pl. '1', 'X', '2', 'OVER_25', 'FH_OVER_05', stb.)
 * @param marketLabel Piac szöveges címkéje fallback elemzéshez (pl. 'Arsenal (1)', '2.5 gól felett')
 * @param homeHalfTimeScore Első félidő hazai gólok (ha elérhető)
 * @param awayHalfTimeScore Első félidő vendég gólok (ha elérhető)
 * @returns true ha nyert, false ha vesztett, null ha nem kiértékelhető (nem befejezett vagy hiányzó adat)
 */
export function evaluatePickWon(
  homeScore?: number,
  awayScore?: number,
  market?: string | PickMarket,
  marketLabel?: string,
  homeHalfTimeScore?: number,
  awayHalfTimeScore?: number
): boolean | null {
  if (
    homeScore === undefined ||
    awayScore === undefined ||
    isNaN(homeScore) ||
    isNaN(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return null;
  }

  const totalGoals = homeScore + awayScore;
  const label = (marketLabel || '').trim().toLowerCase();
  const m = (market || '').trim().toUpperCase();

  // 1. Kombinált piac: BTTS & Over 2.5
  if (
    m === 'BTTS_AND_OVER25' ||
    (label.includes('btts') && (label.includes('2.5') || label.includes('over 2.5') || label.includes('felett')))
  ) {
    return homeScore > 0 && awayScore > 0 && totalGoals > 2.5;
  }

  // 2. Félidős piac: 1. Félidő 0.5 gól felett (FH_OVER_05)
  if (
    m === 'FH_OVER_05' ||
    label.includes('félidő') ||
    label.includes('1.f') ||
    label.includes('ht >0.5') ||
    label.includes('ht > 0.5')
  ) {
    if (
      homeHalfTimeScore !== undefined &&
      awayHalfTimeScore !== undefined &&
      !isNaN(homeHalfTimeScore) &&
      !isNaN(awayHalfTimeScore) &&
      homeHalfTimeScore >= 0 &&
      awayHalfTimeScore >= 0
    ) {
      return (homeHalfTimeScore + awayHalfTimeScore) > 0.5;
    }
    // Ha nincs félidős eredmény rögzítve, de a teljes mérkőzés 0-0 lett, a félidőben sem eshetett gól -> LOST
    if (totalGoals === 0) {
      return false;
    }
    // Ha a végeredményben voltak gólok, de a félidős adat ismeretlen, NEM feltételezhetjük,
    // hogy a 2. félidős gólok az 1. félidőben estek: a helyes döntés a kiértékeletlenség (null).
    return null;
  }

  // 3. Gólszám piacok (Over / Under)
  // Over 3.5
  if (
    m === 'OVER_35' ||
    label.includes('3.5 gól felett') ||
    label.includes('3.5 felett') ||
    label.includes('>3.5') ||
    label.includes('> 3.5')
  ) {
    return totalGoals > 3.5;
  }
  // Under 3.5
  if (
    m === 'UNDER_35' ||
    label.includes('3.5 gól alatt') ||
    label.includes('3.5 alatt') ||
    label.includes('<3.5') ||
    label.includes('< 3.5')
  ) {
    return totalGoals < 3.5;
  }
  // Over 2.5
  if (
    m === 'OVER_25' ||
    label.includes('2.5 gól felett') ||
    label.includes('2.5 felett') ||
    label.includes('>2.5') ||
    label.includes('> 2.5')
  ) {
    return totalGoals > 2.5;
  }
  // Under 2.5
  if (
    m === 'UNDER_25' ||
    label.includes('2.5 gól alatt') ||
    label.includes('2.5 alatt') ||
    label.includes('<2.5') ||
    label.includes('< 2.5')
  ) {
    return totalGoals < 2.5;
  }
  // Over 1.5
  if (
    m === 'OVER_15' ||
    label.includes('1.5 gól felett') ||
    label.includes('1.5 felett') ||
    label.includes('>1.5') ||
    label.includes('> 1.5')
  ) {
    return totalGoals > 1.5;
  }
  // Under 1.5
  if (
    m === 'UNDER_15' ||
    label.includes('1.5 gól alatt') ||
    label.includes('1.5 alatt') ||
    label.includes('<1.5') ||
    label.includes('< 1.5')
  ) {
    return totalGoals < 1.5;
  }

  // 4. Mindkét csapat szerez gólt (BTTS)
  if (
    m === 'BTTS' ||
    m === 'BTTS_YES' ||
    label.includes('mindkét csapat szerez gólt') ||
    label.includes('btts igen') ||
    label === 'btts' ||
    label.includes('(btts)')
  ) {
    return homeScore > 0 && awayScore > 0;
  }
  if (m === 'BTTS_NO' || label.includes('nem szerez mindkét') || label.includes('btts nem')) {
    return homeScore === 0 || awayScore === 0;
  }

  // 5. 1X2 piacok
  // 1: Hazai győzelem
  if (
    m === '1' ||
    m === 'HOME_WIN' ||
    m === 'HOME' ||
    label.endsWith('(1)') ||
    /^(1\b|hazai\b)/i.test(label) ||
    label.includes('győzelem (1)') ||
    label.includes('hazai győzelem')
  ) {
    return homeScore > awayScore;
  }

  // X: Döntetlen
  if (
    m === 'X' ||
    m === 'DRAW' ||
    label.endsWith('(x)') ||
    /^(x\b|döntetlen\b)/i.test(label) ||
    label.includes('döntetlen')
  ) {
    return homeScore === awayScore;
  }

  // 2: Vendég győzelem
  if (
    m === '2' ||
    m === 'AWAY_WIN' ||
    m === 'AWAY' ||
    label.endsWith('(2)') ||
    /^(2\b|vendég\b)/i.test(label) ||
    label.includes('győzelem (2)') ||
    label.includes('vendég győzelem')
  ) {
    return awayScore > homeScore;
  }

  // Ismeretlen piac esetén NULL-t adunk vissza, NEM totalGoals > 2.5!
  return null;
}
