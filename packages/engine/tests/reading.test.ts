/**
 * Chart-reading tests. readChart annotates every pillar with its stem's
 * Ten God (十神) vs. the Day Master, its NaYin (纳音), and the Ten Gods of
 * the branch's hidden stems (藏干), main qi first.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readChart } from '../src/reading.ts';

describe('readChart', () => {
  // 2024-01-01 12:00 UTC, clock time (no longitude): 癸卯 / 甲子 / 甲子 / 庚午,
  // Day Master 甲.
  const reading = readChart({ date: '2024-01-01', time: '12:00', utcOffsetMinutes: 0 });

  it('resolves the Day Master', () => {
    assert.equal(reading.dayMaster, 0);
    assert.equal(reading.dayMasterHanzi, '甲');
    assert.equal(reading.day.hanzi, '甲子');
  });

  it('annotates each stem with its Ten God vs. the Day Master', () => {
    assert.equal(reading.year.tenGod, '正印'); // 癸水生甲木, different polarity
    assert.equal(reading.month.tenGod, '比肩'); // 甲 vs 甲
    assert.equal(reading.day.tenGod, '比肩');
    assert.equal(reading.hour.tenGod, '七杀'); // 庚金克甲木, same polarity
  });

  it('annotates each pillar with its NaYin', () => {
    assert.equal(reading.year.nayin.name, '金箔金');
    assert.equal(reading.year.nayin.element, 'Metal');
    assert.equal(reading.month.nayin.name, '海中金');
    assert.equal(reading.day.nayin.name, '海中金');
    assert.equal(reading.hour.nayin.name, '路旁土');
    assert.equal(reading.hour.nayin.element, 'Earth');
  });

  it('lists hidden-stem Ten Gods with the main qi first', () => {
    assert.deepEqual(reading.year.hiddenGods, ['劫财']); // 卯藏乙
    assert.deepEqual(reading.month.hiddenGods, ['正印']); // 子藏癸
    assert.deepEqual(reading.day.hiddenGods, ['正印']);
    assert.deepEqual(reading.hour.hiddenGods, ['伤官', '正财']); // 午藏丁己
  });
});
