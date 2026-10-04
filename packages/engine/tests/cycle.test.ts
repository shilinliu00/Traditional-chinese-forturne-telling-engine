/**
 * Sexagenary cycle (六十甲子) math tests. The cycle runs
 * 甲子 (0), 乙丑 (1), … 癸亥 (59); yang stems pair only with yang
 * branches, so exactly 60 of the 120 stem/branch pairs are valid.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stemOf, branchOf, ganzhiIndex, ganzhiHanzi } from '../src/cycle.ts';

describe('sexagenary cycle', () => {
  it('maps cycle positions to stems and branches', () => {
    assert.equal(stemOf(0), 0); // 甲
    assert.equal(branchOf(0), 0); // 子
    assert.equal(stemOf(59), 9); // 癸
    assert.equal(branchOf(59), 11); // 亥
    assert.equal(stemOf(10), 0); // 甲戌: stems wrap every 10
    assert.equal(branchOf(10), 10); // 戌
  });

  it('wraps positions outside 0 to 59', () => {
    assert.equal(stemOf(60), 0);
    assert.equal(branchOf(60), 0);
    assert.equal(stemOf(-1), 9);
    assert.equal(branchOf(-1), 11);
  });

  it('renders hanzi for cycle positions', () => {
    assert.equal(ganzhiHanzi(0), '甲子');
    assert.equal(ganzhiHanzi(1), '乙丑');
    assert.equal(ganzhiHanzi(10), '甲戌');
    assert.equal(ganzhiHanzi(59), '癸亥');
  });

  it('round trips every one of the sixty positions', () => {
    for (let i = 0; i < 60; i++) {
      assert.equal(ganzhiIndex(stemOf(i), branchOf(i)), i);
    }
  });

  it('rejects pairs whose polarity does not match', () => {
    assert.throws(() => ganzhiIndex(0, 1), /Invalid pairing/); // 甲丑
    assert.throws(() => ganzhiIndex(1, 0), /Invalid pairing/); // 乙子
    assert.throws(() => ganzhiIndex(9, 10), /Invalid pairing/); // 癸戌
  });
});
