/**
 * Solar-term tests. Reference instants are the National Astronomical
 * Observatory of Japan's published 2024/2025 almanac values
 * (https://eco.mtk.nao.ac.jp/koyomi/yoko/), converted from JST (UTC+9)
 * to UTC. The engine's astronomical computation lands within ~8 minutes
 * of these (typically 1–6); tests allow 15 minutes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOLAR_TERMS,
  solarTermInstant,
  lichunInstant,
  jieTermInstants,
  jieBranchAt,
} from '../src/solarTerms.ts';

const MIN = 60_000;
/** Assert |computed − reference| is within 15 minutes. */
function assertCloseTo(actual: Date, refMs: number, label: string): void {
  const diffMin = Math.abs(actual.getTime() - refMs) / MIN;
  assert.ok(diffMin <= 15, `${label}: off by ${diffMin.toFixed(1)} min (limit 15)`);
}

describe('solar terms', () => {
  it('defines 24 terms starting at Lichun (315°)', () => {
    assert.equal(SOLAR_TERMS.length, 24);
    assert.equal(SOLAR_TERMS[0].name, '立春');
    assert.equal(SOLAR_TERMS[0].longitude, 315);
    assert.equal(SOLAR_TERMS.filter((t) => t.jie).length, 12);
  });

  it('matches published 2024 term instants (NAO almanac, JST→UTC)', () => {
    // [termIndex, UTC reference]
    const cases: Array<[number, number]> = [
      [0, Date.UTC(2024, 1, 4, 8, 27)],   // 立春 2/4 17:27 JST
      [3, Date.UTC(2024, 2, 20, 3, 6)],   // 春分 3/20 12:06 JST
      [8, Date.UTC(2024, 5, 5, 4, 10)],   // 芒种 6/5 13:10 JST
      [9, Date.UTC(2024, 5, 20, 20, 51)], // 夏至 6/21 05:51 JST
      [20, Date.UTC(2024, 11, 6, 15, 17)],// 大雪 12/7 00:17 JST
      [21, Date.UTC(2024, 11, 21, 9, 21)],// 冬至 12/21 18:21 JST
      [22, Date.UTC(2024, 0, 5, 20, 49)], // 小寒 1/6 05:49 JST
    ];
    for (const [index, ref] of cases) {
      const { term, instant } = solarTermInstant(2024, index);
      assertCloseTo(instant, ref, `2024 ${term.name}`);
    }
  });

  it('matches the published 2025 Lichun instant', () => {
    // 立春 2025-02-03 23:10 JST = 14:10 UTC
    assertCloseTo(lichunInstant(2025), Date.UTC(2025, 1, 3, 14, 10), '2025 Lichun');
  });

  it('returns the 12 Jie terms of a year in calendar order', () => {
    const jies = jieTermInstants(2024);
    assert.equal(jies.length, 12);
    assert.equal(jies[0].term.name, '小寒');
    assert.equal(jies[1].term.name, '立春');
    assert.equal(jies[11].term.name, '大雪');
    for (let i = 1; i < jies.length; i++) {
      assert.ok(jies[i].instant > jies[i - 1].instant, 'Jie instants strictly increase');
    }
  });

  it('resolves the BaZi month branch from an instant', () => {
    // 2024-06-01 is between Lixia (05-05) and Mangzhong (06-05) → 巳月 (branch 5)
    assert.equal(jieBranchAt(new Date(Date.UTC(2024, 5, 1, 4, 0))), 5);
    // 2024-01-10 is between Xiaohan (01-05) and Lichun (02-04) → 丑月 (branch 1)
    assert.equal(jieBranchAt(new Date(Date.UTC(2024, 0, 10, 4, 0))), 1);
  });
});
