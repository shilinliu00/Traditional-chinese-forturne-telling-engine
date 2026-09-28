/**
 * Sexagenary cycle (六十甲子) math.
 *
 * The 60 stem-branch pairs run 甲子, 乙丑, 丙寅 … 癸亥. Yang stems always
 * pair with yang branches and yin with yin (10 and 12 share LCM 60, so the
 * pairing is consistent). We index the cycle 0–59 with 甲子 = 0.
 */
import { STEMS, BRANCHES } from './data.ts';

const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** Stem index (0–9) for a cycle position. */
export function stemOf(ganzhiIndex: number): number {
  return mod(ganzhiIndex, 10);
}

/** Branch index (0–11) for a cycle position. */
export function branchOf(ganzhiIndex: number): number {
  return mod(ganzhiIndex, 12);
}

/** Cycle position (0–59) for a stem/branch pair. Throws on invalid pairings. */
export function ganzhiIndex(stem: number, branch: number): number {
  if (STEMS[stem].polarity !== BRANCHES[branch].polarity) {
    throw new Error(
      `Invalid pairing ${STEMS[stem].hanzi}${BRANCHES[branch].hanzi}: yang stems pair only with yang branches.`,
    );
  }
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stem && i % 12 === branch) return i;
  }
  throw new Error('Unreachable: valid pairings always resolve within 60.');
}

/** Hanzi for a cycle position, e.g. 0 → 甲子. */
export function ganzhiHanzi(ganzhiIndex: number): string {
  return STEMS[stemOf(ganzhiIndex)].hanzi + BRANCHES[branchOf(ganzhiIndex)].hanzi;
}
