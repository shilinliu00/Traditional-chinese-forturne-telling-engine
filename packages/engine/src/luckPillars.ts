/**
 * Luck pillars (大运) and annual pillars (流年).
 *
 * Direction rules (顺行/逆行):
 * - Born in a yang year (阳年: year stem 甲丙戊庚壬) → males go forward (顺行),
 *   females go backward (逆行).
 * - Born in a yin year (阴年: year stem 乙丁己辛癸) → females go forward,
 *   males go backward.
 *
 * 起运 (luck-pillar start age): the number of days from birth to the next Jie
 * (节) term instant (forward) or from the previous Jie instant to birth
 * (backward), divided by 3 — the traditional "3 days = 1 year" (三天折合一岁)
 * rule. Fractional precision is kept (e.g. 7.25 years).
 *
 * The first luck pillar is one step forward/backward from the month pillar
 * (stem and branch each step by one; note this is NOT the 60-cycle order —
 * stem and branch advance independently), and each subsequent pillar steps
 * one further, starting 10 years later.
 *
 * Annual pillars (流年): the ganzhi of a Gregorian year, which in BaZi terms
 * begins at that year's Lichun (立春) instant.
 */
import { STEMS } from './data.ts';
import { jieTermInstants } from './solarTerms.ts';
import { birthInstantUtc, calculateBaZi, makePillar, type BirthInput, type Pillar } from './pillars.ts';

const mod = (n: number, m: number): number => ((n % m) + m) % m;
const DAY_MS = 86_400_000;

export type Gender = 'male' | 'female';
/** Luck-pillar direction: 顺行 (forward) or 逆行 (backward). */
export type LuckDirection = 'forward' | 'backward';

export interface LuckPillarInput extends BirthInput {
  gender: Gender;
}

export interface LuckPillar extends Pillar {
  /** Age in years (fractional) when this luck pillar begins. */
  startAge: number;
  direction: LuckDirection;
}

/**
 * Luck-pillar direction from the BaZi year stem (0–9) and gender.
 * 阳男 / 阴女 → forward (顺行); 阴男 / 阳女 → backward (逆行).
 */
export function luckDirection(yearStem: number, gender: Gender): LuckDirection {
  const yangYear = STEMS[mod(yearStem, 10)].polarity === 'yang';
  const forward = (yangYear && gender === 'male') || (!yangYear && gender === 'female');
  return forward ? 'forward' : 'backward';
}

/**
 * The `count` luck pillars (default 8, i.e. 80 years) for a birth input.
 * Each entry carries the fractional age at which it begins.
 */
export function luckPillars(input: LuckPillarInput, count = 8): LuckPillar[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`count must be a positive integer, got ${count}.`);
  }
  const chart = calculateBaZi(input);
  const birth = birthInstantUtc(input);
  const direction = luckDirection(chart.year.stem, input.gender);
  const step = direction === 'forward' ? 1 : -1;

  // Neighboring Jie instants around the birth moment.
  const y = birth.getUTCFullYear();
  const jieMs = [...jieTermInstants(y - 1), ...jieTermInstants(y), ...jieTermInstants(y + 1)]
    .map((t) => t.instant.getTime())
    .sort((a, b) => a - b);
  const t = birth.getTime();
  let days: number;
  if (direction === 'forward') {
    const next = jieMs.find((ms) => ms > t);
    if (next === undefined) throw new Error('No following Jie term found (unreachable).');
    days = (next - t) / DAY_MS;
  } else {
    const prev = [...jieMs].reverse().find((ms) => ms <= t);
    if (prev === undefined) throw new Error('No preceding Jie term found (unreachable).');
    days = (t - prev) / DAY_MS;
  }
  const startAge = days / 3; // 三天折合一岁

  const out: LuckPillar[] = [];
  for (let i = 1; i <= count; i++) {
    const stem = mod(chart.month.stem + step * i, 10);
    const branch = mod(chart.month.branch + step * i, 12);
    out.push({
      ...makePillar(stem, branch),
      startAge: Math.round((startAge + (i - 1) * 10) * 100) / 100,
      direction,
    });
  }
  return out;
}

/**
 * Annual pillar (流年) for a Gregorian year number: the year's ganzhi.
 * In BaZi the flowing year begins at that year's Lichun (立春) instant,
 * so e.g. February 2024 before Lichun still belongs to 癸卯's annual pillar.
 */
export function annualPillar(year: number): Pillar {
  if (!Number.isInteger(year)) throw new Error(`year must be an integer, got ${year}.`);
  return makePillar(mod(year - 4, 10), mod(year - 4, 12));
}
