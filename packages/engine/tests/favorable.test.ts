/**
 * Favorable-element (喜用神/忌神 + 调候) tests. Charts are built directly
 * with makePillar, reusing the strength fixtures' stem/branch index
 * conventions.
 *
 * Stem index reference: 0甲Wood 1乙Wood 2丙Fire 3丁Fire 4戊Earth 5己Earth
 * 6庚Metal 7辛Metal 8壬Water 9癸Water.
 * Branch index reference: 0子 1丑 2寅 3卯 6午 7未 8申 11亥.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { favorableElements } from '../src/favorable.ts';
import { makePillar, type BaZiChart } from '../src/pillars.ts';

function chart(pillars: Array<[number, number]>, dayMaster: number): BaZiChart {
  const [year, month, day, hour] = pillars.map(([s, b]) => makePillar(s, b));
  return { year, month, day, hour, dayMaster };
}

describe('favorableElements', () => {
  it('weak Day Master favors 印/比, disfavors 官杀/食伤', () => {
    // 庚 (Metal) DM, weak (same fixture as the strength weak case):
    // branches 子/寅/卯/午, month 寅 → seasonal neutral (Wood season).
    const c = chart(
      [[0, 0], [1, 2], [6, 3], [2, 6]],
      6,
    );
    const r = favorableElements(c);
    assert.equal(r.dayMasterHanzi, '庚');
    assert.equal(r.verdictHanzi, '身弱');
    assert.deepEqual(r.favorable.map((a) => a.element), ['Earth', 'Metal']);
    assert.deepEqual(r.unfavorable.map((a) => a.element), ['Fire', 'Water']);
    assert.ok(r.favorable.every((a) => a.role === '喜神'));
    assert.ok(r.unfavorable.every((a) => a.role === '忌神'));
    assert.ok(r.favorable[0].reason.includes('印绶生身'));
    assert.equal(r.seasonal.element, null);
    assert.ok(r.seasonal.reason.includes('无调候急需'));
  });

  it('strong Day Master favors 食伤/官杀/财, disfavors 印/比', () => {
    // 甲 (Wood) DM, strong (same fixture as the strength strong case),
    // month 寅 → seasonal neutral.
    const c = chart(
      [[1, 0], [2, 2], [0, 3], [8, 6]],
      0,
    );
    const r = favorableElements(c);
    assert.equal(r.verdictHanzi, '身旺');
    assert.deepEqual(r.favorable.map((a) => a.element), ['Fire', 'Metal', 'Earth']);
    assert.deepEqual(r.unfavorable.map((a) => a.element), ['Water', 'Wood']);
    assert.ok(r.favorable[0].reason.includes('食伤泄秀'));
    assert.ok(r.favorable[1].reason.includes('官杀制身'));
    assert.ok(r.favorable[2].reason.includes('财星耗身'));
    assert.equal(r.seasonal.element, null);
  });

  it('balanced Day Master defers to 调候 with no 扶抑 lean', () => {
    // 甲 DM, balanced (the strength balanced fixture: 得令 1 + 得地 2 + 得势 2 = 5),
    // month 亥 (Water) → needs Fire for 调候.
    const c = chart(
      [[1, 0], [9, 11], [0, 3], [8, 6]],
      0,
    );
    const r = favorableElements(c);
    assert.equal(r.verdictHanzi, '中和');
    assert.deepEqual(r.favorable, []);
    assert.deepEqual(r.unfavorable, []);
    assert.equal(r.seasonal.element, 'Fire');
    assert.ok(r.seasonal.reason.includes('寒湿'));
  });

  it('cold-season month branch (子/丑) needs Fire for 调候', () => {
    const coldSub = chart(
      [[1, 0], [2, 0], [0, 3], [8, 0]],
      0,
    );
    assert.equal(favorableElements(coldSub).seasonal.element, 'Fire');
    // 丑's main qi is Earth, but it is a winter branch — still cold.
    const coldChou = chart(
      [[1, 0], [2, 1], [0, 3], [8, 1]],
      0,
    );
    const r = favorableElements(coldChou);
    assert.equal(r.seasonal.element, 'Fire');
    assert.ok(r.seasonal.reason.includes('丑'));
  });

  it('hot-season month branch (午/巳) needs Water for 调候', () => {
    const hotWu = chart(
      [[1, 0], [2, 6], [0, 3], [8, 6]],
      0,
    );
    const r = favorableElements(hotWu);
    assert.equal(r.seasonal.element, 'Water');
    assert.ok(r.seasonal.reason.includes('炎热'));
  });

  it('mild-season month branch (卯) has no seasonal need', () => {
    const mild = chart(
      [[1, 0], [2, 3], [0, 3], [8, 3]],
      0,
    );
    const r = favorableElements(mild);
    assert.equal(r.seasonal.element, null);
  });

  it('wei month (未) counts as hot season despite its earth main qi', () => {
    // 未 is the last month of summer (三夏 巳午未); main qi is Earth (己),
    // so the Fire main-qi check alone would miss it.
    const hotWei = chart(
      [[1, 0], [2, 7], [0, 3], [8, 3]],
      0,
    );
    const r = favorableElements(hotWei);
    assert.equal(r.seasonal.element, 'Water');
    assert.ok(r.seasonal.reason.includes('未'));
  });
});
