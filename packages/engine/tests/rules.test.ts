/**
 * Rule-evaluation tests. Charts are built directly with makePillar so each
 * case isolates exactly one pattern (branches chosen to avoid accidental
 * 六合/三合/三会/六冲, stems to avoid accidental 五合).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRules } from '../src/rules.ts';
import { makePillar, type BaZiChart } from '../src/pillars.ts';

function chart(pillars: Array<[number, number]>): BaZiChart {
  const [year, month, day, hour] = pillars.map(([s, b]) => makePillar(s, b));
  return { year, month, day, hour, dayMaster: day.stem };
}

describe('rule evaluation', () => {
  it('detects 天干五合 with evidence and source', () => {
    // 甲子 / 己未 / 丙巳 / 丁卯 → 甲己合土 (no other pair combines)
    const hits = evaluateRules(chart([[0, 0], [5, 7], [2, 5], [3, 3]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'stem-combination');
    assert.equal(h.name, '天干五合');
    assert.equal(h.pattern, '甲己合土');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年干甲', '月干己', '合化土']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 地支三合局', () => {
    // 甲申 / 丙子 / 戊辰 / 乙卯 → 申子辰合水局
    const hits = evaluateRules(chart([[0, 8], [2, 0], [4, 4], [1, 3]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'triple-combination');
    assert.equal(h.pattern, '申子辰合水局');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
    assert.deepEqual(h.factors, ['年支申', '月支子', '日支辰']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 地支三会方', () => {
    // 甲寅 / 乙卯 / 丙辰 / 丁未 → 寅卯辰会木方
    const hits = evaluateRules(chart([[0, 2], [1, 3], [2, 4], [3, 7]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'triple-meeting');
    assert.equal(h.pattern, '寅卯辰会木方');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
  });

  it('detects 地支六冲', () => {
    // 甲子 / 丙午 / 戊寅 / 庚辰 → 子午相冲
    const hits = evaluateRules(chart([[0, 0], [2, 6], [4, 2], [6, 4]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'branch-clash');
    assert.equal(h.pattern, '子午相冲');
    assert.deepEqual(h.pillars, ['year', 'month']);
  });

  it('detects 地支六合', () => {
    // 甲子 / 乙丑 / 丙巳 / 丁卯 → 子丑合土 (stems 甲乙丙丁: no 五合)
    const hits = evaluateRules(chart([[0, 0], [1, 1], [2, 5], [3, 3]]));
    const he = hits.find((h) => h.rule === 'branch-six-combination');
    assert.ok(he, `expected a 六合 hit, got ${JSON.stringify(hits.map((h) => h.pattern))}`);
    assert.equal(he.pattern, '子丑合土');
    assert.deepEqual(he.pillars, ['year', 'month']);
  });

  it('returns no hits for a pattern-free chart', () => {
    // 甲子 / 丙寅 / 戊辰 / 壬巳 — no 五合/六合/三合/三会/六冲
    const hits = evaluateRules(chart([[0, 0], [2, 2], [4, 4], [8, 5]]));
    assert.deepEqual(hits, []);
  });
});
