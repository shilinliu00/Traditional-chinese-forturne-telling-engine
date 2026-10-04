/**
 * Five Element (五行) relationships: the generating (生) and
 * controlling (克) cycles.
 */
import { STEMS, BRANCHES, type Element } from './data.ts';
import type { BaZiChart } from './pillars.ts';

/** Generating cycle (相生): Wood→Fire→Earth→Metal→Water→Wood. */
export const GENERATES: Record<Element, Element> = {
  Wood: 'Fire',
  Fire: 'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
};

/** Controlling cycle (相克): Wood→Earth→Water→Fire→Metal→Wood. */
export const CONTROLS: Record<Element, Element> = {
  Wood: 'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
};

export const generates = (a: Element, b: Element): boolean => GENERATES[a] === b;
export const controls = (a: Element, b: Element): boolean => CONTROLS[a] === b;

/** Count of each element across a chart's stems and branches. */
export type ElementCounts = Record<Element, number>;

/**
 * Five-element balance (五行) of a chart: tallies the four heavenly
 * stems plus the four earthly branches (a branch counts as its own
 * element; hidden stems 藏干 are not counted). Always sums to 8.
 */
export function elementBalance(chart: BaZiChart): ElementCounts {
  const counts: ElementCounts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  for (const key of ['year', 'month', 'day', 'hour'] as const) {
    counts[STEMS[chart[key].stem].element] += 1;
    counts[BRANCHES[chart[key].branch].element] += 1;
  }
  return counts;
}
