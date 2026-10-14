/**
 * personalityTraits: Ten God temperament mapping.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEN_GOD_INFO, type TenGod } from '../src/tenGods.ts';
import { readChart } from '../src/reading.ts';
import { personalityTraits, countTenGods } from '../src/personality.ts';

test('top traits carry the full keyword set from the mapping table', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const counts = countTenGods(reading);
  const traits = personalityTraits(reading, 'balanced');
  assert.ok(traits.length > 0 && traits.length <= 3);
  for (const t of traits) {
    // every reported trait has exactly 3 English + 3 Chinese keywords and
    // stays consistent with the TEN_GOD_INFO table and the god counts
    assert.equal(t.keywords.length, 3, t.god);
    assert.equal(t.keywordsZh.length, 3, t.god);
    assert.equal(t.pinyin, TEN_GOD_INFO[t.god].pinyin);
    assert.equal(t.english, TEN_GOD_INFO[t.god].english);
    assert.equal(t.count, counts[t.god]);
  }
});

test('traits are sorted by count descending', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const traits = personalityTraits(reading, 'balanced');
  for (let i = 1; i < traits.length; i++) {
    assert.ok(traits[i - 1].count >= traits[i].count);
  }
});

test('strength verdict modulates the expression', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const strong = personalityTraits(reading, 'strong');
  const weak = personalityTraits(reading, 'weak');
  const balanced = personalityTraits(reading, 'balanced');
  assert.equal(strong[0].expression, 'unrestrained');
  assert.equal(weak[0].expression, 'held back');
  assert.equal(balanced[0].expression, 'steady');
  assert.equal(strong[0].expressionZh, '外放');
  assert.equal(weak[0].expressionZh, '内敛');
  assert.equal(balanced[0].expressionZh, '平和');
});

test('countTenGods tallies stems and hidden stems', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const counts = countTenGods(reading);
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  // 4 pillar stems + sum of hidden stems across the 4 branches
  const hidden = [reading.year, reading.month, reading.day, reading.hour].reduce(
    (n, p) => n + p.hiddenGods.length,
    0,
  );
  assert.equal(total, 4 + hidden);
});

test('no zero count god appears in the top traits', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const traits = personalityTraits(reading, 'strong');
  for (const t of traits) assert.ok(t.count > 0);
});

test('ties break in hanzi code point order, deterministically', () => {
  // 2000-06-15 12:00 (庚辰 壬午 甲辰 庚午): six gods tie at count 2 —
  // 劫财, 伤官, 偏财, 正财, 七杀, 正印. 七 (U+4E03) < 伤 (U+4F24) <
  // 偏 (U+504F), so the top three are stable across calls.
  const first = personalityTraits(
    readChart({ date: '2000-06-15', time: '12:00' }),
    'balanced',
  );
  const second = personalityTraits(
    readChart({ date: '2000-06-15', time: '12:00' }),
    'balanced',
  );
  assert.deepEqual(first.map((t) => t.god), ['七杀', '伤官', '偏财']);
  assert.deepEqual(
    first.map((t) => t.god),
    second.map((t) => t.god),
    'tie order must be stable',
  );
});
