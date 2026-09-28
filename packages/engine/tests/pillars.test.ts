/**
 * Engine tests. Date expectations were verified against published perpetual
 * calendars (万年历): 2024-01-01 = 癸卯年 甲子月 甲子日.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaZi, dayPillarIndex } from '../src/pillars.ts';
import { ganzhiHanzi } from '../src/cycle.ts';
import { tenGod } from '../src/tenGods.ts';

describe('four pillars', () => {
  it('2024-01-01 12:00 → 癸卯年 甲子月 甲子日 庚午时', () => {
    const c = calculateBaZi({ date: '2024-01-01', time: '12:00' });
    assert.equal(c.year.hanzi, '癸卯');
    assert.equal(c.month.hanzi, '甲子');
    assert.equal(c.day.hanzi, '甲子');
    assert.equal(c.hour.hanzi, '庚午');
    assert.equal(c.dayMaster, 0); // 甲
  });

  it('advances the day pillar through the 60-day cycle', () => {
    assert.equal(ganzhiHanzi(dayPillarIndex(2024, 1, 2)), '乙丑');
    assert.equal(ganzhiHanzi(dayPillarIndex(2024, 1, 10)), '癸酉');
    assert.equal(ganzhiHanzi(dayPillarIndex(2023, 12, 31)), '癸亥');
  });

  it('switches year and month pillars at Lichun (立春 ≈ Feb 4)', () => {
    const before = calculateBaZi({ date: '2024-02-03', time: '12:00' });
    assert.equal(before.year.hanzi, '癸卯');
    assert.equal(before.month.hanzi, '乙丑');
    const after = calculateBaZi({ date: '2024-02-10', time: '12:00' });
    assert.equal(after.year.hanzi, '甲辰');
    assert.equal(after.month.hanzi, '丙寅');
  });

  it('switches year and month pillars at the exact Lichun instant (2024-02-04 16:27 Beijing)', () => {
    // Published Lichun 2024: 16:27 Beijing time. 16:00 is still 癸卯年/乙丑月…
    const before = calculateBaZi({ date: '2024-02-04', time: '16:00' });
    assert.equal(before.year.hanzi, '癸卯');
    assert.equal(before.month.hanzi, '乙丑');
    // …17:00 has crossed into 甲辰年/丙寅月.
    const after = calculateBaZi({ date: '2024-02-04', time: '17:00' });
    assert.equal(after.year.hanzi, '甲辰');
    assert.equal(after.month.hanzi, '丙寅');
  });

  it('rolls the day over at 23:00 (late 子时 belongs to the next day)', () => {
    const c = calculateBaZi({ date: '2024-01-01', time: '23:30' });
    assert.equal(c.day.hanzi, '乙丑');
    assert.equal(c.hour.hanzi, '丙子');
  });

  it('keeps early 子时 (00:00–01:00) on the same day', () => {
    const c = calculateBaZi({ date: '2024-01-01', time: '00:30' });
    assert.equal(c.day.hanzi, '甲子');
    assert.equal(c.hour.hanzi, '甲子');
  });

  it('applies true-solar-time correction from longitude', () => {
    // 01:05 at 116°E on the 120°E meridian → solar 00:49 → 子时, not 丑时
    const c = calculateBaZi({ date: '2024-01-01', time: '01:05', longitude: 116, meridian: 120 });
    assert.equal(c.hour.hanzi, '甲子');
  });
});

describe('ten gods', () => {
  it('computes all ten relations against day master 甲', () => {
    const cases: Array<[number, string]> = [
      [0, '比肩'], [1, '劫财'],
      [2, '食神'], [3, '伤官'],
      [4, '偏财'], [5, '正财'],
      [6, '七杀'], [7, '正官'],
      [8, '偏印'], [9, '正印'],
    ];
    for (const [stem, expected] of cases) {
      assert.equal(tenGod(0, stem), expected);
    }
  });
});
