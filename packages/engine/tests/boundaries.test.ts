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
});
