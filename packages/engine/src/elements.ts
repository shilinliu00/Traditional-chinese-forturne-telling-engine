/**
 * Five Element (五行) relationships: the generating (生) and
 * controlling (克) cycles.
 */
import type { Element } from './data.ts';

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
