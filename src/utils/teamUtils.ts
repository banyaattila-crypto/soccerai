/**
 * Közös csapatnév-normalizáló és egyeztető segédfüggvények.
 *
 * Biztosítja a több forrásból (Football-Data.org, API-Sports, statisztikai modellek)
 * származó csapatnevek egységes összehasonlítását, párosítását és deduplikációját.
 */

/**
 * Normalizálja a csapatnevet diakritikus jelek (ékezetek) és felesleges klub-előtagok/utótagok nélkül.
 *
 * Fontos tervezési szabály:
 * SOHA nem csonkol fix karakterszámra (pl. `.slice(0, 5)`), hogy megelőzze az azonos
 * kezdetű csapatnevek összeütközését és a mérkőzések téves eldobását:
 * - "Manchester City" vs. "Manchester United" -> "manchestercity" vs. "manchesterunited"
 * - "Real Madrid" vs. "Real Betis" vs. "Real Balompédica" -> "realmadrid" vs. "realbetis" vs. "realbalompedica"
 * - "Sheffield United" vs. "Sheffield Wednesday" -> "sheffieldunited" vs. "sheffieldwednesday"
 * - "Bristol City" vs. "Bristol Rovers" -> "bristolcity" vs. "bristolrovers"
 */
export function normalizeTeamName(rawName: string | undefined | null): string {
  if (!rawName) return '';
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // az NFD nem bontja a ł, ø, đ, ß, æ, œ betűket: kézi átírás (pl. Widzew Łódź, Bodø/Glimt, Brøndby)
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/đ/g, 'd')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/(^|\s)1\.\s+/g, ' ')
    .replace(/\b(fc|cf|afc|sc|rc|ac|as|ss|bv|bvb|sv|vfb|vfl|rb|ud|ca|cd|tsv|ogc|ssc|sad)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
