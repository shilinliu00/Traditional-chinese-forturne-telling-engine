/**
 * Structural rule evaluation (合/冲 analysis) over a computed chart.
 *
 * Design note: chart *calculation* lives in pillars.ts; this module is the
 * *interpretation* layer. Each rule hit keeps its evidence (the pillars
 * that triggered it, as human-readable factors) and the classical source
 * documenting the pattern, so every judgment stays verifiable instead of
 * being a bare label.
 */
import { STEMS, BRANCHES, type Element } from './data.ts';
import type { BaZiChart } from './pillars.ts';

export type PillarKey = 'year' | 'month' | 'day' | 'hour';

const PILLAR_ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];
const PILLAR_NAME: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' };

export interface RuleHit {
  /** Stable rule id, e.g. 'stem-combination'. */
  rule: string;
  /** Rule family name, e.g. '天干五合'. */
  name: string;
  /** The matched pattern, e.g. '甲己合土'. */
  pattern: string;
  /** Pillars involved, in chart order. */
  pillars: PillarKey[];
  /** Evidence factors, e.g. ['年干甲', '月干己']. */
  factors: string[];
  /** Classical source documenting the pattern. */
  source: string;
}

const ELEMENT_HANZI: Record<Element, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

/** 天干五合: [stemA, stemB, resulting element]. Documented in 《三命通会》. */
const STEM_COMBINATIONS: Array<[number, number, Element]> = [
  [0, 5, 'Earth'], // 甲己合土
  [1, 6, 'Metal'], // 乙庚合金
  [2, 7, 'Water'], // 丙辛合水
  [3, 8, 'Wood'],  // 丁壬合木
  [4, 9, 'Fire'],  // 戊癸合火
];

/** 地支六合: [branchA, branchB, resulting element]. Documented in 《三命通会》. */
const BRANCH_SIX_COMBINATIONS: Array<[number, number, Element]> = [
  [0, 1, 'Earth'],  // 子丑合土
  [2, 11, 'Wood'],  // 寅亥合木
  [3, 10, 'Fire'],  // 卯戌合火
  [4, 9, 'Metal'],  // 辰酉合金
  [5, 8, 'Water'],  // 巳申合水
  [6, 7, 'Earth'],  // 午未合土
];

/** 地支三合局: [branches..., resulting element, pattern name]. Documented in 《三命通会》. */
const TRIPLE_COMBINATIONS: Array<{ branches: [number, number, number]; element: Element; name: string }> = [
  { branches: [8, 0, 4], element: 'Water', name: '申子辰合水局' },
  { branches: [11, 3, 7], element: 'Wood', name: '亥卯未合木局' },
  { branches: [2, 6, 10], element: 'Fire', name: '寅午戌合火局' },
  { branches: [5, 9, 1], element: 'Metal', name: '巳酉丑合金局' },
];

/** 地支三会方: [branches..., resulting element, pattern name]. Documented in 《三命通会》. */
const TRIPLE_MEETINGS: Array<{ branches: [number, number, number]; element: Element; name: string }> = [
  { branches: [2, 3, 4], element: 'Wood', name: '寅卯辰会木方' },
  { branches: [5, 6, 7], element: 'Fire', name: '巳午未会火方' },
  { branches: [8, 9, 10], element: 'Metal', name: '申酉戌会金方' },
  { branches: [11, 0, 1], element: 'Water', name: '亥子丑会水方' },
];

/** 地支六冲: clashing branch pairs. Documented in 《三命通会》. */
const BRANCH_CLASHES: Array<[number, number]> = [
  [0, 6],   // 子午冲
  [1, 7],   // 丑未冲
  [2, 8],   // 寅申冲
  [3, 9],   // 卯酉冲
  [4, 10],  // 辰戌冲
  [5, 11],  // 巳亥冲
];

const SOURCE = '《三命通会》';

function pillarWithStem(chart: BaZiChart, key: PillarKey, stem: number): PillarKey | undefined {
  return chart[key].stem === stem ? key : undefined;
}

function pillarWithBranch(chart: BaZiChart, key: PillarKey, branch: number): PillarKey | undefined {
  return chart[key].branch === branch ? key : undefined;
}

/**
 * Evaluate the structural 合/冲 rules against a chart.
 * Returns one hit per matched pattern, in deterministic pillar order.
 */
export function evaluateRules(chart: BaZiChart): RuleHit[] {
  const hits: RuleHit[] = [];

  // 天干五合 — any two of the four heavenly stems.
  for (const [a, b, element] of STEM_COMBINATIONS) {
    const pillars = PILLAR_ORDER.filter((k) => pillarWithStem(chart, k, a) ?? pillarWithStem(chart, k, b));
    const hasA = pillars.some((k) => chart[k].stem === a);
    const hasB = pillars.some((k) => chart[k].stem === b);
    if (hasA && hasB) {
      const pa = pillars.find((k) => chart[k].stem === a) as PillarKey;
      const pb = pillars.find((k) => chart[k].stem === b) as PillarKey;
      hits.push({
        rule: 'stem-combination',
        name: '天干五合',
        pattern: `${STEMS[a].hanzi}${STEMS[b].hanzi}合${ELEMENT_HANZI[element]}`,
        pillars: [pa, pb].sort((x, y) => PILLAR_ORDER.indexOf(x) - PILLAR_ORDER.indexOf(y)),
        factors: [
          `${PILLAR_NAME[pa]}干${STEMS[a].hanzi}`,
          `${PILLAR_NAME[pb]}干${STEMS[b].hanzi}`,
          `合化${ELEMENT_HANZI[element]}`,
        ],
        source: SOURCE,
      });
    }
  }

  // 地支六合 — any two of the four earthly branches.
  for (const [a, b, element] of BRANCH_SIX_COMBINATIONS) {
    const pa = PILLAR_ORDER.find((k) => chart[k].branch === a);
    const pb = PILLAR_ORDER.find((k) => chart[k].branch === b);
    if (pa !== undefined && pb !== undefined) {
      hits.push({
        rule: 'branch-six-combination',
        name: '地支六合',
        pattern: `${BRANCHES[a].hanzi}${BRANCHES[b].hanzi}合${ELEMENT_HANZI[element]}`,
        pillars: [pa, pb],
        factors: [
          `${PILLAR_NAME[pa]}支${BRANCHES[a].hanzi}`,
          `${PILLAR_NAME[pb]}支${BRANCHES[b].hanzi}`,
          `合化${ELEMENT_HANZI[element]}`,
        ],
        source: SOURCE,
      });
    }
  }

  // 地支三合局 / 三会方 — all three branches present.
  const triple = (
    rule: string,
    name: string,
    list: typeof TRIPLE_COMBINATIONS,
  ): void => {
    for (const t of list) {
      const pillars = t.branches.map((br) => PILLAR_ORDER.find((k) => chart[k].branch === br));
      if (pillars.every((p) => p !== undefined)) {
        const ps = (pillars as PillarKey[]).sort((x, y) => PILLAR_ORDER.indexOf(x) - PILLAR_ORDER.indexOf(y));
        hits.push({
          rule,
          name,
          pattern: t.name,
          pillars: ps,
          factors: ps.map((k) => `${PILLAR_NAME[k]}支${BRANCHES[chart[k].branch].hanzi}`),
          source: SOURCE,
        });
      }
    }
  };
  triple('triple-combination', '地支三合局', TRIPLE_COMBINATIONS);
  triple('triple-meeting', '地支三会方', TRIPLE_MEETINGS);

  // 地支六冲 — any clashing pair.
  for (const [a, b] of BRANCH_CLASHES) {
    const pa = PILLAR_ORDER.find((k) => chart[k].branch === a);
    const pb = PILLAR_ORDER.find((k) => chart[k].branch === b);
    if (pa !== undefined && pb !== undefined) {
      hits.push({
        rule: 'branch-clash',
        name: '地支六冲',
        pattern: `${BRANCHES[a].hanzi}${BRANCHES[b].hanzi}相冲`,
        pillars: [pa, pb],
        factors: [`${PILLAR_NAME[pa]}支${BRANCHES[a].hanzi}`, `${PILLAR_NAME[pb]}支${BRANCHES[b].hanzi}`],
        source: SOURCE,
      });
    }
  }

  return hits;
}
