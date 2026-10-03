/**
 * Boundary edge cases: pillar transitions land exactly on computed
 * astronomical instants (not on calendar dates), and the 60-day cycle
 * stays continuous across leap days.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaZi, dayPillarIndex } from '../src/pillars.ts';
import { lichunInstant, solarTermInstant, jieBranchAt } from '../src/solarTerms.ts';

describe('term boundaries', () => {
  it('year pillar switches exactly at the Lichun instant (2024-02-04 08:21 UTC)', () => {
    const instant = lichunInstant(2024);
    assert.ok(instant.toISOString().startsWith('2024-02-04T08:21'));
    // One minute before: still BaZi year 2023 (癸卯年).
    const before = calculateBaZi({
      date: '2024-02-04', time: '08:20', utcOffsetMinutes: 0,
    });
    assert.equal(before.year.hanzi, '癸卯');
    // One minute after the instant's minute: BaZi year 2024 (甲辰年).
    const after = calculateBaZi({
      date: '2024-02-04', time: '08:22', utcOffsetMinutes: 0,
    });
    assert.equal(after.year.hanzi, '甲辰');
  });

  it('month branch switches exactly at the Jingzhe instant (寅 → 卯)', () => {
    const instant = solarTermInstant(2024, 2).instant; // 惊蛰 opens 卯 month
    assert.ok(instant.toISOString().startsWith('2024-03-05T02:16'));
    const before = calculateBaZi({
      date: '2024-03-05', time: '02:15', utcOffsetMinutes: 0,
    });
    assert.equal(before.month.branch, 2); // 寅
    const after = calculateBaZi({
      date: '2024-03-05', time: '02:17', utcOffsetMinutes: 0,
    });
    assert.equal(after.month.branch, 3); // 卯
    // Direct instant-level check: the boundary is inclusive at the instant.
    assert.equal(jieBranchAt(new Date(instant.getTime() - 1)), 2);
    assert.equal(jieBranchAt(instant), 3);
  });
});

describe('timezone handling', () => {
  it('the same UTC instant gives the same year and month in any timezone', () => {
    // 2024-02-04 08:22 UTC is just after Lichun 2024: 甲辰 year in both views.
    const utc = calculateBaZi({ date: '2024-02-04', time: '08:22', utcOffsetMinutes: 0 });
    const beijing = calculateBaZi({ date: '2024-02-04', time: '16:22', utcOffsetMinutes: 480 });
    const newYork = calculateBaZi({ date: '2024-02-04', time: '03:22', utcOffsetMinutes: -300 });
    assert.equal(utc.year.hanzi, '甲辰');
    assert.equal(beijing.year.hanzi, utc.year.hanzi);
    assert.equal(newYork.year.hanzi, utc.year.hanzi);
    assert.equal(beijing.month.hanzi, utc.month.hanzi);
    assert.equal(newYork.month.hanzi, utc.month.hanzi);
    assert.equal(beijing.day.hanzi, utc.day.hanzi);
  });
});

describe('late zi hour (晚子时)', () => {
  it('rolls the day over at exactly 23:00, not one minute before', () => {
    const before = calculateBaZi({ date: '2024-01-01', time: '22:59' });
    assert.equal(before.day.hanzi, '甲子');
    assert.equal(before.hour.hanzi, '乙亥'); // 亥时 of the 甲 day
    const at = calculateBaZi({ date: '2024-01-01', time: '23:00' });
    assert.equal(at.day.hanzi, '乙丑'); // late 子时 belongs to the next day
    assert.equal(at.hour.hanzi, '丙子'); // 子时 stem from the new 乙 day stem
  });

  it('switches the hour branch at exactly 01:00 (子 → 丑) without rolling the day', () => {
    const zi = calculateBaZi({ date: '2024-01-01', time: '00:59' });
    assert.equal(zi.day.hanzi, '甲子');
    assert.equal(zi.hour.hanzi, '甲子');
    const chou = calculateBaZi({ date: '2024-01-01', time: '01:00' });
    assert.equal(chou.day.hanzi, '甲子'); // early 子时 stays on the same day
    assert.equal(chou.hour.hanzi, '乙丑');
  });

  it('longitude correction can push clock time into late zi hour', () => {
    // 22:50 at 135°E on the 120°E meridian → solar ≈ 23:47 → next day.
    const c = calculateBaZi({
      date: '2024-01-01', time: '22:50', longitude: 135, meridian: 120,
    });
    assert.equal(c.day.hanzi, '乙丑');
    assert.equal(c.hour.hanzi, '丙子');
  });

  it('longitude correction can pull clock time back out of late zi hour', () => {
    // 23:10 at 105°E on the 120°E meridian → solar ≈ 22:07 → same day.
    const c = calculateBaZi({
      date: '2024-01-01', time: '23:10', longitude: 105, meridian: 120,
    });
    assert.equal(c.day.hanzi, '甲子');
    assert.equal(c.hour.hanzi, '乙亥');
  });
});

describe('leap-day continuity', () => {
  it('day pillars advance by exactly one across Feb 29', () => {
    const d28 = dayPillarIndex(2024, 2, 28);
    const d29 = dayPillarIndex(2024, 2, 29);
    const d01 = dayPillarIndex(2024, 3, 1);
    assert.equal(d29, (d28 + 1) % 60);
    assert.equal(d01, (d29 + 1) % 60);
  });

  it('day pillars advance by exactly one across a non-leap Feb 28 → Mar 1', () => {
    const d28 = dayPillarIndex(2023, 2, 28);
    const d01 = dayPillarIndex(2023, 3, 1);
    assert.equal(d01, (d28 + 1) % 60);
  });

  it('a Feb 29 birth resolves to the continuous 60-cycle day pillar', () => {
    const idx = dayPillarIndex(2024, 2, 29);
    const c = calculateBaZi({ date: '2024-02-29', time: '12:00' });
    assert.equal(c.day.stem, idx % 10);
    assert.equal(c.day.branch, idx % 12);
  });

  it('rejects Feb 29 in century years not divisible by 400', () => {
    // 1900 and 2100 are not leap years under the Gregorian century rule.
    for (const date of ['1900-02-29', '2100-02-29']) {
      assert.throws(() => calculateBaZi({ date, time: '12:00' }), /Invalid date/);
    }
  });

  it('accepts Feb 29 in year 2000 and keeps the 60-cycle continuous', () => {
    // 2000 is divisible by 400, so it is a leap year.
    const d28 = dayPillarIndex(2000, 2, 28);
    const d29 = dayPillarIndex(2000, 2, 29);
    const d01 = dayPillarIndex(2000, 3, 1);
    assert.equal(d29, (d28 + 1) % 60);
    assert.equal(d01, (d29 + 1) % 60);
    const c = calculateBaZi({ date: '2000-02-29', time: '12:00' });
    assert.equal(c.day.stem, d29 % 10);
    assert.equal(c.day.branch, d29 % 12);
  });
});
