/**
 * Equation-of-time tests. Anchor values are published almanac figures:
 * the EoT swings between about -14.2 min (Feb 11) and +16.4 min (Nov 3),
 * with secondary extrema near May 14 (+3.7) and Jul 26 (-6.4).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { equationOfTimeAt } from '../src/solarTerms.ts';
import { calculateBaZi } from '../src/pillars.ts';

describe('equation of time', () => {
  it('matches published anchor values within 1 minute', () => {
    const cases: Array<[string, number]> = [
      ['2024-02-11', -14.2],
      ['2024-05-14', 3.7],
      ['2024-07-26', -6.4],
      ['2024-11-03', 16.4],
      ['2024-01-01', -3.3],
    ];
    for (const [date, expected] of cases) {
      const actual = equationOfTimeAt(new Date(`${date}T12:00:00Z`));
      assert.ok(
        Math.abs(actual - expected) < 1,
        `${date}: expected ≈ ${expected} min, got ${actual.toFixed(2)} min`,
      );
    }
  });

  it('stays within the physical ±17 minute band across the year', () => {
    for (let m = 1; m <= 12; m++) {
      const v = equationOfTimeAt(new Date(Date.UTC(2024, m - 1, 15, 12)));
      assert.ok(Math.abs(v) <= 17, `month ${m}: EoT = ${v.toFixed(2)} min`);
    }
  });

  it('shifts the hour pillar when the EoT crosses a boundary', () => {
    // 2024-02-11, EoT ≈ -14.2 min. 01:00 clock time at the standard
    // meridian: solar time ≈ 00:46 → still 子时, not 丑时.
    const c = calculateBaZi({ date: '2024-02-11', time: '01:00', longitude: 120, meridian: 120 });
    assert.equal(c.hour.hanzi, '丙子'); // 乙巳日, 丙子时
  });

  it('does not touch clock time when no longitude is given', () => {
    // 2024-02-11 01:00 without longitude keeps the old behavior: 丑时.
    const c = calculateBaZi({ date: '2024-02-11', time: '01:00' });
    assert.equal(c.hour.hanzi, '丁丑'); // 乙巳日, 丁丑时
  });
});
