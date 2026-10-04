/**
 * Five-element cycle and balance tests. The balance fixture is the
 * verified 2024-01-01 chart: 癸卯年 甲子月 甲子日 庚午时.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GENERATES, CONTROLS, generates, controls, elementBalance,
} from '../src/elements.ts';
import { calculateBaZi, makePillar, type BaZiChart } from '../src/pillars.ts';

describe('five element cycles', () => {
  it('generates in the order wood fire earth metal water wood', () => {
    assert.equal(GENERATES.Wood, 'Fire');
    assert.equal(GENERATES.Fire, 'Earth');
    assert.equal(GENERATES.Earth, 'Metal');
    assert.equal(GENERATES.Metal, 'Water');
    assert.equal(GENERATES.Water, 'Wood');
    assert.ok(generates('Water', 'Wood'));
    assert.ok(!generates('Wood', 'Water'));
  });

  it('controls in the order wood earth water fire metal wood', () => {
    assert.equal(CONTROLS.Wood, 'Earth');
    assert.equal(CONTROLS.Earth, 'Water');
    assert.equal(CONTROLS.Water, 'Fire');
    assert.equal(CONTROLS.Fire, 'Metal');
    assert.equal(CONTROLS.Metal, 'Wood');
    assert.ok(controls('Metal', 'Wood'));
    assert.ok(!controls('Wood', 'Metal'));
  });
});

describe('element balance', () => {
  it('tallies the four stems and four branches', () => {
    // 癸卯 甲子 甲子 庚午: stems 水木木金, branches 木水水火
    const chart = calculateBaZi({ date: '2024-01-01', time: '12:00' });
    assert.deepEqual(elementBalance(chart), {
      Wood: 3, Fire: 1, Earth: 0, Metal: 1, Water: 3,
    });
  });

  it('always sums to eight across varied charts', () => {
    const inputs: BaZiChart[] = [
      calculateBaZi({ date: '1990-05-20', time: '08:30' }),
      calculateBaZi({ date: '2000-02-29', time: '23:15' }),
      calculateBaZi({ date: '2024-12-31', time: '00:05', longitude: 90 }),
    ];
    // A hand-built chart: 甲寅 / 丙午 / 戊戌 / 庚子
    const [year, month, day, hour] = [[0, 2], [2, 6], [4, 10], [6, 0]]
      .map(([s, b]) => makePillar(s, b));
    inputs.push({ year, month, day, hour, dayMaster: day.stem });
    for (const chart of inputs) {
      const counts = elementBalance(chart);
      const total = Object.values(counts).reduce((n, c) => n + c, 0);
      assert.equal(total, 8);
    }
  });
});
