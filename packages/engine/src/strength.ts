/**
 * Day Master strength (旺衰) analysis.
 *
 * Design note: like rules.ts, this is an *interpretation* layer over a
 * computed chart — it scores the classical 得令/得地/得势 criteria
 * (documented in 《三命通会》 and 《滴天髓》) instead of deciding a chart's
 * fortune directly:
 *
 * - 得令 (de ling): the Day Master is born in the month branch whose main
 *   qi (本气) is the Day Master's own element or generates it.
 * - 得地 (de di): the Day Master is "rooted" (通根) — some branch's hidden
 *   stems contain a stem of the Day Master's element.
 * - 得势 (de shi): the other heavenly stems support the Day Master —
 *   stems of its own element, or of the element that generates it.
 *
 * This is a deterministic first-order aid, not a full 喜用神
 * (favorable-element) judgment; the score thresholds are heuristic.
 */
import { STEMS, BRANCHES, type Element } from './data.ts';
import { generates } from './elements.ts';
import type { BaZiChart, Pillar } from './pillars.ts';

const PILLAR_NAME: Record<'year' | 'month' | 'day' | 'hour', string> = {
  year: '年', month: '月', day: '日', hour: '时',
};

const LING_POINTS = 2; // weight of 得令
const DI_POINTS = 1; // per rooted branch
const SHI_SAME_POINTS = 1; // per stem of the Day Master's element
const SHI_GENERATE_POINTS = 0.5; // per stem of the generating element

const MAX_SCORE = LING_POINTS + 4 * DI_POINTS + 3 * SHI_SAME_POINTS; // 9

const STRONG_CUTOFF = 5.5;
const WEAK_CUTOFF = 3.5;

export type StrengthVerdict = 'strong' | 'balanced' | 'weak';

export interface StrengthCriterion {
  /** e.g. '得令', '得地', '得势'. */
  name: string;
  points: number;
  /** Human-readable evidence, e.g. '月支寅为木，与日主甲同类'. */
  factors: string[];
}

export interface StrengthResult {
  /** Day Master stem hanzi, e.g. '甲'. */
  dayMasterHanzi: string;
  /** Day Master five-element. */
  element: Element;
  score: number;
  max: number;
  verdict: StrengthVerdict;
  /** 身旺 / 中和 / 身弱. */
  verdictHanzi: string;
  criteria: StrengthCriterion[];
  /** Classical source documenting the 得令/得地/得势 criteria. */
  source: string;
}

const SOURCE = '《三命通会》·《滴天髓》';

const ELEMENT_HANZI: Record<Element, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

function pillarKeys(): Array<'year' | 'month' | 'day' | 'hour'> {
  return ['year', 'month', 'day', 'hour'];
}

/**
 * Score the Day Master's 旺衰: 得令 (month support) + 得地 (rooting)
 * + 得势 (stem support).
 */
export function dayMasterStrength(chart: BaZiChart): StrengthResult {
  const dmElement: Element = STEMS[chart.dayMaster].element;
  const criteria: StrengthCriterion[] = [];

  // 得令: month branch's main qi (本气 = first hidden stem).
  const monthBranch = BRANCHES[chart.month.branch];
  const mainQiElement: Element = STEMS[monthBranch.hiddenStems[0]].element;
  let ling = 0;
  const lingFactors: string[] = [];
  if (mainQiElement === dmElement) {
    ling = LING_POINTS;
    lingFactors.push(`月支${monthBranch.hanzi}为${ELEMENT_HANZI[dmElement]}，与日主同类`);
  } else if (generates(mainQiElement, dmElement)) {
    ling = LING_POINTS / 2;
    lingFactors.push(`月支${monthBranch.hanzi}为${ELEMENT_HANZI[mainQiElement]}，生扶日主${ELEMENT_HANZI[dmElement]}`);
  } else {
    lingFactors.push(`月支${monthBranch.hanzi}为${ELEMENT_HANZI[mainQiElement]}，不得令`);
  }
  criteria.push({ name: '得令', points: ling, factors: lingFactors });

  // 得地: rooted (通根) in any branch's hidden stems.
  const diFactors: string[] = [];
  let di = 0;
  for (const key of pillarKeys()) {
    const branch = BRANCHES[chart[key].branch];
    const rooted = branch.hiddenStems.some((s) => STEMS[s].element === dmElement);
    if (rooted) {
      di += DI_POINTS;
      diFactors.push(`${PILLAR_NAME[key]}支${branch.hanzi}藏${ELEMENT_HANZI[dmElement]}干通根`);
    }
  }
  if (di === 0) diFactors.push('四支均无同类藏干，未通根');
  criteria.push({ name: '得地', points: di, factors: diFactors });

  // 得势: support from the other three heavenly stems.
  const shiFactors: string[] = [];
  let shi = 0;
  for (const key of pillarKeys()) {
    if (key === 'day') continue; // the Day Master itself
    const pillar: Pillar = chart[key];
    const stem = STEMS[pillar.stem];
    const label = `${PILLAR_NAME[key]}干${stem.hanzi}`;
    if (stem.element === dmElement) {
      shi += SHI_SAME_POINTS;
      shiFactors.push(`${label}与日主同类`);
    } else if (generates(stem.element, dmElement)) {
      shi += SHI_GENERATE_POINTS;
      shiFactors.push(`${label}生扶日主`);
    }
  }
  if (shi === 0) shiFactors.push('其余天干均未生扶日主');
  criteria.push({ name: '得势', points: shi, factors: shiFactors });

  const score = ling + di + shi;
  const verdict: StrengthVerdict = score >= STRONG_CUTOFF ? 'strong' : score <= WEAK_CUTOFF ? 'weak' : 'balanced';
  const verdictHanzi = verdict === 'strong' ? '身旺' : verdict === 'weak' ? '身弱' : '中和';

  return {
    dayMasterHanzi: STEMS[chart.dayMaster].hanzi,
    element: dmElement,
    score,
    max: MAX_SCORE,
    verdict,
    verdictHanzi,
    criteria,
    source: SOURCE,
  };
}
