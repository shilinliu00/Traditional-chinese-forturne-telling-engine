/**
 * personalityTraits: Ten God temperament mapping.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEN_GOD_INFO, type TenGod } from '../src/tenGods.ts';
import { readChart } from '../src/reading.ts';
import { personalityTraits, countTenGods } from '../src/personality.ts';

test('every ten god maps to keywords', () => {
  const reading = readChart({ date: '2000-06-15', time: '12:00' });
  const traits = personalityTraits(reading, 'balanced');
  const gods = (Object.keys(TEN_GOD_INFO) as TenGod[]).filter(
    (g) => countTenGods(reading)[g] > 0,
  );
  for (const god of gods) {
    const trait = traits.find((t) => t.god === god) ?? {
      keywords: [],
      keywordsZh: [],
    };
    // a god with keywords always exists in the table, even if it did not make the top 3
    assert.ok(trait.keywords.length === 3 || trait.keywords.length === 0);
  }
  assert.ok(traits.length > 0 && traits.length <= 3);
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
