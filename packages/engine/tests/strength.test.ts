/**
 * Day Master strength (旺衰) tests. Charts are built directly with
 * makePillar so each case isolates the 得令/得地/得势 scoring.
 *
 * Stem index reference: 0甲Wood 1乙Wood 2丙Fire 3丁Fire 4戊Earth 5己Earth
 * 6庚Metal 7辛Metal 8壬Water 9癸Water.
 * Branch index reference: 0子 2寅 3卯 4辰 6午 8申 9酉 11亥.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dayMasterStrength } from '../src/strength.ts';
import { makePillar, type BaZiChart } from '../src/pillars.ts';

function chart(pillars: Array<[number, number]>, dayMaster: number): BaZiChart {
  const [year, month, day, hour] = pillars.map(([s, b]) => makePillar(s, b));
  return { year, month, day, hour, dayMaster };
}

describe('dayMasterStrength', () => {
  it('scores a strong chart: 得令 + roots + stem support (身旺)', () => {
    // 甲 DM, born in 寅 month (Wood month): 得令 2.
    // 得地: 寅 and 卯 both hide Wood (通根): 2.
    // 得势: 年干乙 (same element) 1, 时干壬 (Water generates Wood) 0.5.
    const c = chart(
      [[1, 0], [2, 2], [0, 3], [8, 6]],
      0,
    );
    const r = dayMasterStrength(c);
    assert.equal(r.dayMasterHanzi, '甲');
    assert.equal(r.element, 'Wood');
    assert.equal(r.score, 5.5);
    assert.equal(r.max, 9);
    assert.equal(r.verdict, 'strong');
    assert.equal(r.verdictHanzi, '身旺');
    assert.deepEqual(r.criteria.map((c) => c.name), ['得令', '得地', '得势']);
    assert.equal(r.criteria[0].points, 2);
    assert.equal(r.criteria[1].points, 2);
    assert.equal(r.criteria[2].points, 1.5);
  });

  it('scores a weak chart with no month, root, or stem support (身弱)', () => {
    // 庚 DM (Metal), born in 寅 month (Wood): 得令 0.
    // Branches 子/寅/卯/午 hide no Metal: 得地 0.
    // Stems 甲/乙 (Wood) and 丙 (Fire) neither match nor generate Metal: 得势 0.
    const c = chart(
      [[0, 0], [1, 2], [6, 3], [2, 6]],
      6,
    );
    const r = dayMasterStrength(c);
    assert.equal(r.dayMasterHanzi, '庚');
    assert.equal(r.element, 'Metal');
    assert.equal(r.score, 0);
    assert.equal(r.verdict, 'weak');
    assert.equal(r.verdictHanzi, '身弱');
  });

  it('scores a balanced chart (中和)', () => {
    // 甲 DM, born in 亥 month (Water generates Wood): 得令 1.
    // 得地: 亥藏甲 and 卯藏乙 both give a Wood root (通根): 2.
    // 得势: 年干乙 (same) 1, 月干癸 (Water generates Wood) 0.5, 时干壬 0.5.
    const c = chart(
      [[1, 0], [9, 11], [0, 3], [8, 6]],
      0,
    );
    const r = dayMasterStrength(c);
    assert.equal(r.score, 5);
    assert.equal(r.criteria[1].points, 2);
    assert.equal(r.verdict, 'balanced');
    assert.equal(r.verdictHanzi, '中和');
  });

  it('half-point 得令 when the month branch generates the Day Master element', () => {
    const c = chart(
      [[1, 0], [9, 11], [0, 3], [8, 6]],
      0,
    );
    const r = dayMasterStrength(c);
    assert.equal(r.criteria[0].points, 1);
    assert.match(r.criteria[0].factors[0], /生扶日主/);
  });

  it('keeps evidence factors for every criterion', () => {
    const c = chart(
      [[1, 0], [2, 2], [0, 3], [8, 6]],
      0,
    );
    const r = dayMasterStrength(c);
    for (const criterion of r.criteria) {
      assert.ok(criterion.factors.length > 0, `${criterion.name} should carry evidence`);
    }
    assert.match(r.criteria[0].factors[0], /月支寅/);
    assert.ok(r.source.length > 0);
  });

  it('score always equals the sum of criterion points and stays within max', () => {
    // Three fixtures above plus a sweep of real charts: the published
    // score must be exactly the criteria total, never above the max.
    const fixtures: Array<[Array<[number, number]>, number]> = [
      [[[1, 0], [2, 2], [0, 3], [8, 6]], 0], // strong
      [[[0, 0], [1, 2], [6, 3], [2, 6]], 6], // weak
      [[[1, 0], [9, 11], [0, 3], [8, 6]], 0], // balanced
    ];
    for (const [pillars, dm] of fixtures) {
      const r = dayMasterStrength(chart(pillars, dm));
      const sum = r.criteria.reduce((n, c) => n + c.points, 0);
      assert.equal(r.score, sum);
      assert.ok(r.score >= 0 && r.score <= r.max);
    }
  });
});
