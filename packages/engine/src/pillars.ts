/**
 * Four-pillar (四柱) calculation: year 年柱, month 月柱, day 日柱, hour 时柱.
 *
 * Key BaZi rules implemented here:
 * - Year pillar changes at the astronomical instant of Lichun (立春), not
 *   Jan 1 or Lunar New Year.
 * - Month pillar changes at the astronomical Jie (节) solar-term instants;
 *   stem via the Five Tigers rule (五虎遁): 甲/己 years start 丙寅,
 *   乙/庚 → 戊寅, 丙/辛 → 庚寅, 丁/壬 → 壬寅, 戊/癸 → 甲寅.
 * - Day pillar is a continuous 60-day cycle anchored to the verified
 *   reference 2024-01-01 = 甲子日.
 * - Hour pillar stem via the Five Rats rule (五鼠遁): 甲/己 days start 甲子,
 *   乙/庚 → 丙子, 丙/辛 → 戊子, 丁/壬 → 庚子, 戊/癸 → 壬子.
 * - True solar time: longitude correction vs. the clock timezone's standard
 *   meridian (1° = 4 minutes). Equation of time not yet applied.
 * - Late 子时 rule: 23:00–24:00 solar time belongs to the *next* day.
 */
import { STEMS, BRANCHES } from './data.ts';
import { jieBranchAt, lichunInstant } from './solarTerms.ts';

const mod = (n: number, m: number): number => ((n % m) + m) % m;
const DAY_MS = 86_400_000;

/** Verified anchor: 2024-01-01 was 甲子日 (cycle index 0). */
const ANCHOR_MS = Date.UTC(2024, 0, 1);

export interface BirthInput {
  /** Gregorian birth date, 'YYYY-MM-DD'. */
  date: string;
  /** Local clock time, 'HH:mm' (24h). */
  time: string;
  /** Birthplace longitude in degrees East. Enables true-solar-time correction. */
  longitude?: number;
  /** Standard meridian of the clock timezone in degrees East (default 120 = Beijing time). */
  meridian?: number;
  /**
   * Clock timezone's offset from UTC in minutes (e.g. 480 = UTC+8).
   * Defaults to `meridian / 15 * 60`, which is exact for whole/hour-offset zones.
   */
  utcOffsetMinutes?: number;
}

export interface Pillar {
  stem: number;
  branch: number;
  hanzi: string;
}

export interface BaZiChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  /** Day Master (日主) stem index — the reference point for Ten Gods. */
  dayMaster: number;
}

export function makePillar(stem: number, branch: number): Pillar {
  return { stem, branch, hanzi: STEMS[stem].hanzi + BRANCHES[branch].hanzi };
}

function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date '${date}', expected YYYY-MM-DD.`);
  return { y, m, d };
}

function parseTime(time: string): { hh: number; mm: number } {
  const [hh, mm] = time.split(':').map(Number);
  if (hh === undefined || mm === undefined || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error(`Invalid time '${time}', expected HH:mm.`);
  }
  return { hh, mm };
}

/**
 * The birth moment as a UTC instant, from local clock time and the clock
 * timezone's UTC offset. Year/month pillar boundaries (solar-term instants)
 * are compared against this moment.
 */
export function birthInstantUtc(input: BirthInput): Date {
  const { y, m, d } = parseDate(input.date);
  const { hh, mm } = parseTime(input.time);
  const offset = input.utcOffsetMinutes ?? ((input.meridian ?? 120) / 15) * 60;
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - offset * 60_000);
}

/** BaZi year: the Gregorian year whose Lichun instant has already passed. */
export function baziYearAt(instant: Date): number {
  const y = instant.getUTCFullYear();
  return instant.getTime() < lichunInstant(y).getTime() ? y - 1 : y;
}

export function yearPillarAt(instant: Date): Pillar {
  const by = baziYearAt(instant);
  return makePillar(mod(by - 4, 10), mod(by - 4, 12));
}

/** Branches in Jie-month order starting at 寅 (used by the Five Tigers rule). */
const MONTH_ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];

export function monthPillarAt(instant: Date): Pillar {
  const yearStem = mod(baziYearAt(instant) - 4, 10);
  const branch = jieBranchAt(instant);
  const yinMonthStem = mod((yearStem % 5) * 2 + 2, 10); // 五虎遁
  const stem = mod(yinMonthStem + MONTH_ORDER.indexOf(branch), 10);
  return makePillar(stem, branch);
}

/** 60-cycle index (0 = 甲子) of the day pillar for a Gregorian date. */
export function dayPillarIndex(y: number, m: number, d: number): number {
  const days = Math.round((Date.UTC(y, m - 1, d) - ANCHOR_MS) / DAY_MS);
  return mod(days, 60);
}

/**
 * Hour pillar from the day stem and solar minutes since midnight.
 * Handles the 子时 day rollover at the caller level (see calculateBaZi).
 */
export function hourPillar(dayStem: number, solarMinutes: number): Pillar {
  const t = mod(Math.floor(solarMinutes), 1440);
  const branch =
    t < 60 || t >= 1380 ? 0 : // 子 23:00–01:00
    t < 180 ? 1 :  // 丑
    t < 300 ? 2 :  // 寅
    t < 420 ? 3 :  // 卯
    t < 540 ? 4 :  // 辰
    t < 660 ? 5 :  // 巳
    t < 780 ? 6 :  // 午
    t < 900 ? 7 :  // 未
    t < 1020 ? 8 : // 申
    t < 1140 ? 9 : // 酉
    t < 1260 ? 10 : // 戌
    11; // 亥 21:00–23:00
  const ziHourStem = mod((dayStem % 5) * 2, 10); // 五鼠遁
  return makePillar(mod(ziHourStem + branch, 10), branch);
}

export function calculateBaZi(input: BirthInput): BaZiChart {
  const { y, m, d } = parseDate(input.date);
  const { hh, mm } = parseTime(input.time);
  const birth = birthInstantUtc(input);

  // True solar time: 1° of longitude = 4 minutes vs. the standard meridian.
  const meridian = input.meridian ?? 120;
  const solarTotal = hh * 60 + mm + (input.longitude !== undefined ? (input.longitude - meridian) * 4 : 0);
  const solarMinutes = mod(Math.floor(solarTotal), 1440);

  // Date shift: longitude correction can push across midnight, and 23:00–24:00
  // (late 子时) belongs to the next day in BaZi.
  let dateShift = Math.floor(solarTotal / 1440);
  if (solarMinutes >= 1380) dateShift += 1;

  const effDate = new Date(Date.UTC(y, m - 1, d) + dateShift * DAY_MS);
  const dayIndex = dayPillarIndex(effDate.getUTCFullYear(), effDate.getUTCMonth() + 1, effDate.getUTCDate());
  const dayStem = mod(dayIndex, 10);

  return {
    year: yearPillarAt(birth),
    month: monthPillarAt(birth),
    day: makePillar(dayStem, mod(dayIndex, 12)),
    hour: hourPillar(dayStem, solarMinutes),
    dayMaster: dayStem,
  };
}
