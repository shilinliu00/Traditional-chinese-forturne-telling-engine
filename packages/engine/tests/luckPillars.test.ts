/**
 * Luck-pillar and annual-pillar tests.
 *
 * Reference solar-term instants are the National Astronomical Observatory
 * of Japan's published 2024 almanac (JST = UTC+9); the start ages below are
 * derived from those instants via the 三天折合一岁 (3 days = 1 year) rule,
 * so tolerances are generous (±0.1 year ≈ ±7 hours of term error).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { luckDirection, luckPillars, annualPillar } from '../src/luckPillars.ts';
import { calculateBaZi, baziYearAt, yearPillarAt } from '../src/pillars.ts';

describe('luck direction', () => {
  it('阳男/阴女 forward, 阴男/阳女 backward', () => {
    assert.equal(luckDirection(0, 'male'), 'forward'); // 甲 (yang) 男
    assert.equal(luckDirection(0, 'female'), 'backward');
    assert.equal(luckDirection(1, 'female'), 'forward'); // 乙 (yin) 女
    assert.equal(luckDirection(1, 'male'), 'backward');
    assert.equal(luckDirection(8, 'male'), 'forward'); // 壬 (yang) 男
    assert.equal(luckDirection(9, 'female'), 'forward'); // 癸 (yin) 女
  });
});

describe('luck pillars', () => {
  // Male born 2024-06-01 12:00 Beijing (UTC+8): 甲辰 year (yang) → forward.
  // Month pillar 己巳; next Jie is 芒种 2024-06-05 04:10 UTC →
  // (4d 10m)/3 ≈ 1.34 years.
  const maleInput = { date: '2024-06-01', time: '12:00', gender: 'male' as const };

  it('steps forward from the month pillar for a 阳男', () => {
    const chart = calculateBaZi(maleInput);
    assert.equal(chart.month.hanzi, '己巳');
    const luck = luckPillars(maleInput, 3);
    assert.equal(luck.length, 3);
    assert.equal(luck[0].direction, 'forward');
    assert.equal(luck[0].hanzi, '庚午');
    assert.equal(luck[1].hanzi, '辛未');
    assert.equal(luck[2].hanzi, '壬申');
    assert.ok(Math.abs(luck[0].startAge - 1.34) < 0.1, `startAge=${luck[0].startAge}`);
    assert.ok(Math.abs(luck[1].startAge - 11.34) < 0.1, `startAge=${luck[1].startAge}`);
  });

  it('steps backward from the month pillar for a 阳女', () => {
    // Female, same birth: backward. Previous Jie is 立夏 2024-05-05 00:10 UTC →
    // (27d 3h50m)/3 ≈ 9.05 years.
    const luck = luckPillars({ date: '2024-06-01', time: '12:00', gender: 'female' }, 2);
    assert.equal(luck[0].direction, 'backward');
    assert.equal(luck[0].hanzi, '戊辰');
    assert.equal(luck[1].hanzi, '丁卯');
    assert.ok(Math.abs(luck[0].startAge - 9.05) < 0.1, `startAge=${luck[0].startAge}`);
  });

  it('generates 8 pillars by default with 10-year steps', () => {
    const luck = luckPillars(maleInput);
    assert.equal(luck.length, 8);
    for (let i = 1; i < luck.length; i++) {
      assert.ok(
        Math.abs(luck[i].startAge - luck[i - 1].startAge - 10) < 1e-9,
        'pillars step by 10 years',
      );
    }
  });

  it('rejects invalid counts', () => {
    assert.throws(() => luckPillars(maleInput, 0), /positive integer/);
  });

  it('start ages stay within the 3 days 1 year scale across the year', () => {
    // The first start age is days-to-neighboring-Jie / 3; neighboring Jies
    // are at most ~31.5 days apart, so it must land in [0, 10.6) for every
    // birthday and direction. A window bug (e.g. picking a Jie a year off)
    // would blow past this bound.
    for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2025, 0, 1); t += 5 * 86_400_000) {
      const d = new Date(t);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      for (const gender of ['male', 'female'] as const) {
        const luck = luckPillars({ date, time: '12:00', utcOffsetMinutes: 0, gender });
        const first = luck[0].startAge;
        assert.ok(first >= 0 && first < 10.6, `${date} ${gender}: startAge=${first}`);
        for (let i = 1; i < luck.length; i++) {
          assert.ok(
            Math.abs(luck[i].startAge - luck[i - 1].startAge - 10) < 1e-9,
            `${date} ${gender}: pillars step by 10 years`,
          );
        }
      }
    }
  });
});

describe('annual pillars', () => {
  it('returns the ganzhi of a Gregorian year', () => {
    assert.equal(annualPillar(2024).hanzi, '甲辰');
    assert.equal(annualPillar(2025).hanzi, '乙巳');
    assert.equal(annualPillar(2023).hanzi, '癸卯');
    assert.equal(annualPillar(2000).hanzi, '庚辰');
  });

  it('annualPillar(baziYearAt(t)) always matches the chart year pillar', () => {
    // The web UI renders the flowing year as annualPillar(baziYearAt(now));
    // it must agree with yearPillarAt at every instant, especially around
    // the Lichun boundary where the BaZi year rolls over.
    for (const y of [1999, 2000, 2023, 2024, 2025, 2026, 2027]) {
      for (const d of [`${y}-01-15T00:00:00Z`, `${y}-02-03T12:00:00Z`, `${y}-02-05T00:00:00Z`, `${y}-06-01T00:00:00Z`]) {
        const t = new Date(d);
        assert.equal(
          annualPillar(baziYearAt(t)).hanzi,
          yearPillarAt(t).hanzi,
          `mismatch at ${d}`,
        );
      }
    }
  });
});
