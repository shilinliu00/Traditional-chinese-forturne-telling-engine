/**
 * NaYin (纳音) tests. Spot values are the textbook 60-entry sequence:
 * 甲子 = 海中金, 丙寅 = 炉中火, 戊辰 = 大林木, 庚午 = 路旁土, 壬申 = 剑锋金 …
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nayinOf } from '../src/nayin.ts';
import { readChart } from '../src/reading.ts';

describe('nayin', () => {
  it('returns the textbook NaYin for known stem-branch pairs', () => {
    const cases: Array<[number, number, string, string]> = [
      [0, 0, '海中金', 'Metal'], // 甲子
      [2, 2, '炉中火', 'Fire'], // 丙寅
      [4, 4, '大林木', 'Wood'], // 戊辰
      [6, 6, '路旁土', 'Earth'], // 庚午
      [8, 8, '剑锋金', 'Metal'], // 壬申
      [9, 11, '大海水', 'Water'], // 癸亥
      [2, 8, '山下火', 'Fire'], // 丙申
      [4, 10, '平地木', 'Wood'], // 戊戌
    ];
    for (const [stem, branch, name, element] of cases) {
      const n = nayinOf(stem, branch);
      assert.equal(n.name, name);
      assert.equal(n.element, element);
    }
  });

  it('covers all 60 cycle positions in name pairs', () => {
    // Each NaYin name spans exactly one stem pair (甲子/乙丑, 丙寅/丁卯, …).
    for (let i = 0; i < 60; i += 2) {
      const a = nayinOf(i % 10, i % 12);
      const b = nayinOf((i + 1) % 10, (i + 1) % 12);
      assert.equal(a.name, b.name, `positions ${i}/${i + 1}`);
      assert.equal(a.element, b.element);
    }
  });

  it('annotates chart readings with NaYin', () => {
    // 2024-01-01 → 癸卯年 = 金箔金命
    const r = readChart({ date: '2024-01-01', time: '12:00' });
    assert.equal(r.year.nayin.name, '金箔金');
    assert.equal(r.year.nayin.element, 'Metal');
    assert.equal(r.day.nayin.name, '海中金'); // 甲子日
  });
});
