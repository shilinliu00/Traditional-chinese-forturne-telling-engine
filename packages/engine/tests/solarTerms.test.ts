/**
 * Solar-term tests. Reference instants are the National Astronomical
 * Observatory of Japan's published 2024/2025 almanac values
 * (https://eco.mtk.nao.ac.jp/koyomi/yoko/), converted from JST (UTC+9)
 * to UTC. The engine's astronomical computation lands within ~8 minutes
 * of these (typically 1–6); tests allow 15 minutes. The 2026 and 2027
 * Lichun references come from the published Lichun table (Skyfield
 * ephemeris for 2021–2030), also in UTC. The 2028 Lichun reference is
 * 15:31 Beijing time (07:31 UTC) on Feb 4, per the Hong Kong Observatory
 * almanac and the Astronomy Engine solar term table. The 2029 Lichun
 * reference is 13:20 UT on Feb 3, per the 立春 instant table and
 * 21:20 Beijing time per the Hong Kong Observatory sourced calendar.
 * The 2030 Lichun reference is 19:08 UT on Feb 3 (04:08 JST Feb 4
 * per the NAOJ long term table, 03:08 Beijing time per the Hong Kong
 * Observatory sourced calendar; the Astronomy Engine solar term
 * table agrees).
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

  it('matches the published 2026 Lichun instant', () => {
    // 立春 2026-02-03 20:02 UTC (Skyfield table value; 04:02 Beijing time
    // on Feb 4, matching the widely published Feb 4 04:01–04:02 local time).
    // This is the current year boundary the live demo's year pillar turns on.
    assertCloseTo(lichunInstant(2026), Date.UTC(2026, 1, 3, 20, 2), '2026 Lichun');
  });

  it('matches the published 2027 Lichun instant', () => {
    // 立春 2027-02-04 01:46 UTC (Skyfield table value; 09:46 Beijing time,
    // matching the Hong Kong Observatory February 2027 almanac).
    // Next year's boundary the live demo's year pillar turns on.
    assertCloseTo(lichunInstant(2027), Date.UTC(2027, 1, 4, 1, 46), '2027 Lichun');
  });

  it('matches the published 2028 Lichun instant', () => {
    // 立春 2028-02-04 07:31 UTC (15:31 Beijing time, per the Hong Kong
    // Observatory February 2028 almanac and the Astronomy Engine solar
    // term table; the 立春 table lists 07:30 UT to the minute).
    // The 2028 boundary the live demo's year pillar turns on.
    assertCloseTo(lichunInstant(2028), Date.UTC(2028, 1, 4, 7, 31), '2028 Lichun');
  });

  it('matches the published 2029 Lichun instant', () => {
    // 立春 2029-02-03 13:20 UTC (21:20 Beijing time, per the 立春
    // instant table and the Hong Kong Observatory sourced calendar).
    // The 2029 boundary the live demo's year pillar turns on.
    assertCloseTo(lichunInstant(2029), Date.UTC(2029, 1, 3, 13, 20), '2029 Lichun');
  });

  it('matches the published 2030 Lichun instant', () => {
    // 立春 2030-02-03 19:08 UTC (04:08 JST Feb 4 per NAOJ, 03:08 Beijing
    // time per the Hong Kong Observatory sourced calendar, and the
    // Astronomy Engine solar term table lists 19:08 UTC).
    // The 2030 boundary the live demo's year pillar turns on.
    assertCloseTo(lichunInstant(2030), Date.UTC(2030, 1, 3, 19, 8), '2030 Lichun');
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
