/**
 * Rule-evaluation tests. Charts are built directly with makePillar so each
 * case isolates exactly one pattern (branches chosen to avoid accidental
 * 六合/三合/三会/六冲/六害, stems to avoid accidental 五合).
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
    // 甲寅 / 己寅 / 丙卯 / 丁卯 → 甲己合土 (寅/卯 branches dodge every
    // branch pair relation, including 半合; stems 甲己丙丁 form no other 五合)
    const hits = evaluateRules(chart([[0, 2], [5, 2], [2, 3], [3, 3]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'stem-combination');
    assert.equal(h.name, '天干五合');
    assert.equal(h.pattern, '甲己合土');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年干甲', '月干己', '合化土']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 寅巳申三刑', () => {
    // 甲寅 / 乙巳 / 丙申 / 丁寅 → 寅巳申三刑. 寅申相冲 and 寅巳相害 also
    // fire on this chart, so the 三刑 hit is found among the hits.
    const hits = evaluateRules(chart([[0, 2], [1, 5], [2, 8], [3, 2]]));
    const h = hits.find((x) => x.rule === 'branch-punishment');
    assert.ok(h, `expected a 三刑 hit, got ${JSON.stringify(hits.map((x) => x.pattern))}`);
    assert.equal(h.pattern, '寅巳申三刑');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
    assert.deepEqual(h.factors, ['年支寅', '月支巳', '日支申', '恃势之刑']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 丑戌未三刑', () => {
    // 甲丑 / 乙戌 / 丙未 / 丁丑 → 丑戌未三刑 (丑未相冲 also fires, so the
    // 三刑 hit is found among the hits)
    const hits = evaluateRules(chart([[0, 1], [1, 10], [2, 7], [3, 1]]));
    const h = hits.find((x) => x.rule === 'branch-punishment');
    assert.ok(h, `expected a 三刑 hit, got ${JSON.stringify(hits.map((x) => x.pattern))}`);
    assert.equal(h.pattern, '丑戌未三刑');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
    assert.deepEqual(h.factors, ['年支丑', '月支戌', '日支未', '无恩之刑']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 子卯相刑', () => {
    // 甲子 / 乙卯 / 丙寅 / 丁寅 → 子卯相刑, isolated (寅 branches dodge
    // every other pair relation; stems form no 五合 or 相冲)
    const hits = evaluateRules(chart([[0, 0], [1, 3], [2, 2], [3, 2]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'branch-punishment');
    assert.equal(h.pattern, '子卯相刑');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年支子', '月支卯', '无礼之刑']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 自刑 when a self-punishing branch repeats', () => {
    // 甲辰 / 乙辰 / 丙寅 / 丁寅 → 辰自刑 (寅 branches dodge every other
    // pair relation; stems form no 五合 or 相冲)
    const hits = evaluateRules(chart([[0, 4], [1, 4], [2, 2], [3, 2]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'branch-punishment');
    assert.equal(h.pattern, '辰自刑');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年支辰', '月支辰']);
    assert.equal(h.source, '《三命通会》');
  });

  it('a single 辰 with no repeat is not 自刑', () => {
    // 甲辰 / 乙寅 / 丙寅 / 丁寅 → no hits
    const hits = evaluateRules(chart([[0, 4], [1, 2], [2, 2], [3, 2]]));
    assert.deepEqual(hits, []);
  });

  it('detects 天干相冲', () => {
    // 甲寅 / 庚寅 / 丙寅 / 丁寅 → 甲庚相冲 (all-寅 branches dodge every
    // branch pair relation; stems form no 五合)
    const hits = evaluateRules(chart([[0, 2], [6, 2], [2, 2], [3, 2]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'stem-clash');
    assert.equal(h.name, '天干相冲');
    assert.equal(h.pattern, '甲庚相冲');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年干甲', '月干庚']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects two stem clashes in one chart', () => {
    // 甲寅 / 庚寅 / 丙寅 / 壬寅 → 甲庚相冲 + 丙壬相冲 (stems form no 五合)
    const hits = evaluateRules(chart([[0, 2], [6, 2], [2, 2], [8, 2]]));
    assert.equal(hits.length, 2);
    assert.equal(hits[0].pattern, '甲庚相冲');
    assert.deepEqual(hits[0].pillars, ['year', 'month']);
    assert.equal(hits[1].pattern, '丙壬相冲');
    assert.deepEqual(hits[1].pillars, ['day', 'hour']);
  });

  it('detects 地支三合局', () => {
    // 甲申 / 丙子 / 戊辰 / 乙子 → 申子辰合水局 (the repeated 子 keeps the
    // branch pairs clean of 合/冲/害)
    const hits = evaluateRules(chart([[0, 8], [2, 0], [4, 4], [1, 0]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'triple-combination');
    assert.equal(h.pattern, '申子辰合水局');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
    assert.deepEqual(h.factors, ['年支申', '月支子', '日支辰']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 地支三会方', () => {
    // 甲寅 / 乙卯 / 丙辰 / 丁未 → 寅卯辰会木方. A find-based assertion
    // (like the 六合 case): 卯辰 are also a 六害 pair, so the meeting
    // never appears alone in the hit list.
    const hits = evaluateRules(chart([[0, 2], [1, 3], [2, 4], [3, 7]]));
    const h = hits.find((x) => x.rule === 'triple-meeting');
    assert.ok(h, `expected a 三会 hit, got ${JSON.stringify(hits.map((x) => x.pattern))}`);
    assert.equal(h.pattern, '寅卯辰会木方');
    assert.deepEqual(h.pillars, ['year', 'month', 'day']);
    // The same chart also carries 卯未 (no 亥): a 旺墓半合 of 亥卯未合木局.
    const half = hits.find((x) => x.rule === 'half-combination');
    assert.ok(half, `expected a 半合 hit, got ${JSON.stringify(hits.map((x) => x.pattern))}`);
    assert.equal(half.pattern, '卯未半合木局');
    assert.deepEqual(half.pillars, ['month', 'hour']);
  });

  it('detects 地支六冲', () => {
    // 甲子 / 乙午 / 丙酉 / 丁亥 → 子午相冲 (酉/亥 dodge every other pair
    // relation; stems form no 五合 or 相冲)
    const hits = evaluateRules(chart([[0, 0], [1, 6], [2, 9], [3, 11]]));
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

  it('detects 地支六害', () => {
    // 甲子 / 乙未 / 丙子 / 丁未 → 子未相害 (repeated 子/未 keep every
    // other pair relation out; stems 甲乙丙丁 form no 五合 or 相冲)
    const hits = evaluateRules(chart([[0, 0], [1, 7], [2, 0], [3, 7]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'branch-harm');
    assert.equal(h.name, '地支六害');
    assert.equal(h.pattern, '子未相害');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年支子', '月支未']);
    assert.equal(h.source, '《三命通会》');
  });

  it('returns no hits for a pattern-free chart', () => {
    // 甲巳 / 乙巳 / 丙巳 / 丁巳 — repeated 巳 branches dodge every pair
    // relation (no 半合/合/冲/害/刑 possible), stems form no 五合 or 相冲
    const hits = evaluateRules(chart([[0, 5], [1, 5], [2, 5], [3, 5]]));
    assert.deepEqual(hits, []);
  });

  it('reports overlapping patterns independently', () => {
    // 甲申 / 乙子 / 丙辰 / 丁丑: 子 belongs to both 申子辰合水局 and
    // 子丑合土 — each pattern gets its own hit with its own evidence.
    // Stems 甲乙丙丁 form no 五合, and no 冲/害 pairs are present.
    const hits = evaluateRules(chart([[0, 8], [1, 0], [2, 4], [3, 1]]));
    assert.equal(hits.length, 2);
    assert.equal(hits[0].rule, 'branch-six-combination');
    assert.equal(hits[0].pattern, '子丑合土');
    assert.deepEqual(hits[0].pillars, ['month', 'hour']);
    assert.equal(hits[1].rule, 'triple-combination');
    assert.equal(hits[1].pattern, '申子辰合水局');
    assert.deepEqual(hits[1].pillars, ['year', 'month', 'day']);
    assert.ok(hits.every((h) => h.source === '《三命通会》'));
  });

  it('detects 生旺半合', () => {
    // 甲申 / 丙子 / 戊戌 / 丁戌 → 申子半合水局 (no 辰, so no full triple;
    // 戌 branches dodge every other pair relation)
    const hits = evaluateRules(chart([[0, 8], [2, 0], [4, 10], [3, 10]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'half-combination');
    assert.equal(h.name, '地支半合局');
    assert.equal(h.pattern, '申子半合水局');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年支申', '月支子', '生旺半合']);
    assert.equal(h.source, '《三命通会》');
  });

  it('detects 旺墓半合', () => {
    // 甲子 / 丙辰 / 戊寅 / 丁寅 → 子辰半合水局 (no 申, so no full triple;
    // 寅 branches dodge every other pair relation)
    const hits = evaluateRules(chart([[0, 0], [2, 4], [4, 2], [3, 2]]));
    assert.equal(hits.length, 1);
    const [h] = hits;
    assert.equal(h.rule, 'half-combination');
    assert.equal(h.pattern, '子辰半合水局');
    assert.deepEqual(h.pillars, ['year', 'month']);
    assert.deepEqual(h.factors, ['年支子', '月支辰', '旺墓半合']);
    assert.equal(h.source, '《三命通会》');
  });

  it('a complete triple combination suppresses its half pairs', () => {
    // 甲申 / 丙子 / 戊辰 / 乙子 → 申子辰合水局 only; the 申子 and 子辰
    // pairs are covered by the full triple, not reported again
    const hits = evaluateRules(chart([[0, 8], [2, 0], [4, 4], [1, 0]]));
    assert.equal(hits.length, 1);
    assert.equal(hits[0].rule, 'triple-combination');
    assert.ok(!hits.some((h) => h.rule === 'half-combination'));
  });

  it('a 生/墓 pair without the 旺 branch is not a half combination', () => {
    // 甲申 / 丙辰 / 戊未 / 丁未 → 申辰 with no 子 is an 拱, not 半合;
    // 未 branches dodge every other pair relation
    const hits = evaluateRules(chart([[0, 8], [2, 4], [4, 7], [3, 7]]));
    assert.deepEqual(hits, []);
  });

  it('lists pair rule pillars in chart order, not table order', () => {
    // 甲午 / 甲子 / 甲酉 / 甲亥 → 子午相冲: the 午 sits in the year pillar
    // but the pair table lists 子 first (酉/亥 fillers dodge every other
    // pair relation; all 甲 stems form no 五合 or 相冲)
    const clash = evaluateRules(chart([[0, 6], [0, 0], [0, 9], [0, 11]]));
    assert.equal(clash.length, 1);
    assert.equal(clash[0].pattern, '子午相冲');
    assert.deepEqual(clash[0].pillars, ['year', 'month']);
    assert.deepEqual(clash[0].factors, ['年支午', '月支子']);
    // 甲丑 / 甲子 / 甲寅 / 甲寅 → 子丑合土, same ordering story
    const combo = evaluateRules(chart([[0, 1], [0, 0], [0, 2], [0, 2]]));
    assert.equal(combo.length, 1);
    assert.equal(combo[0].pattern, '子丑合土');
    assert.deepEqual(combo[0].pillars, ['year', 'month']);
    assert.deepEqual(combo[0].factors, ['年支丑', '月支子', '合化土']);
    // 甲午 / 甲丑 / 甲申 / 甲卯 → 丑午相害, same ordering story
    const harm = evaluateRules(chart([[0, 6], [0, 1], [0, 8], [0, 3]]));
    assert.equal(harm.length, 1);
    assert.equal(harm[0].pattern, '丑午相害');
    assert.deepEqual(harm[0].pillars, ['year', 'month']);
    assert.deepEqual(harm[0].factors, ['年支午', '月支丑']);
  });
});
