/**
 * Favorable-element (喜用神 / 忌神) analysis with seasonal 调候.
 *
 * Design note: like strength.ts, this is an *interpretation* layer over a
 * computed chart, not a fortune judgment. It derives a first-order
 * 扶抑 (support/suppress) recommendation from the Day Master strength
 * verdict, plus a 调候 (seasonal temperature adjustment) need from the
 * month branch — the two pillars of classical 用神 selection as
 * documented in 《三命通会》 and 《穷通宝鉴》. Full 用神 determination
 * weighs the whole chart (格局, 十神组合); this module is a
 * deterministic first-order aid only.
 *
 * Rules (first-order):
 * - 身弱 (weak): 喜印、比 — favor the element that generates the Day
 *   Master (印绶生身) and the Day Master's own element (比劫帮身);
 *   忌官杀、食伤 — disfavor the element that controls the Day Master
 *   and the element it generates.
 * - 身旺 (strong): 喜食伤、官杀、财 — favor the element the Day Master
 *   generates (泄秀), the element that controls it (克制), and the
 *   element it controls (耗身); 忌印、比.
 * - 中和 (balanced): no 扶抑 lean; rely on 调候 only.
 *
 * 调候: births in the cold season (month branch whose main qi is Water,
 * or 丑) tend to need Fire (水寒需火暖); births in the hot season (main
 * qi Fire, 巳午, plus 未 as the last month of summer) tend to need Water
 * (火炎需水济).
 */
import { STEMS, BRANCHES, type Element } from './data.ts';
import { GENERATES, CONTROLS } from './elements.ts';
import { dayMasterStrength } from './strength.ts';
import type { BaZiChart } from './pillars.ts';

const SOURCE = '《三命通会》·《穷通宝鉴》';

const ELEMENT_HANZI: Record<Element, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

/** The element that generates `el` (its 印), e.g. generatesFrom('Wood') = 'Water'. */
function generatesFrom(el: Element): Element {
  return (Object.keys(GENERATES) as Element[]).find((k) => GENERATES[k] === el)!;
}

/** The element that controls `el` (its 官杀). */
function controlsFrom(el: Element): Element {
  return (Object.keys(CONTROLS) as Element[]).find((k) => CONTROLS[k] === el)!;
}

export interface ElementAdvice {
  element: Element;
  /** e.g. '喜神 (favorable)' or '忌神 (unfavorable)'. */
  role: '喜神' | '忌神';
  /** Human-readable rationale, e.g. '印绶生身：水生木'. */
  reason: string;
}

export interface SeasonalNeed {
  /** Element needed for temperature balance, or null when the season is mild. */
  element: Element | null;
  /** Human-readable rationale, e.g. '月支子水寒，需火调候'. */
  reason: string;
}

export interface FavorableResult {
  /** Day Master stem hanzi, e.g. '甲'. */
  dayMasterHanzi: string;
  element: Element;
  /** 身旺 / 中和 / 身弱, inherited from dayMasterStrength. */
  verdictHanzi: string;
  /** 喜神: elements that help this chart. */
  favorable: ElementAdvice[];
  /** 忌神: elements that hurt this chart. */
  unfavorable: ElementAdvice[];
  /** 调候: seasonal temperature need from the month branch. */
  seasonal: SeasonalNeed;
  /** Classical source. */
  source: string;
}

/**
 * Recommend favorable (喜神) and unfavorable (忌神) elements for a chart,
 * from the Day Master strength verdict plus the birth season's 调候 need.
 */
export function favorableElements(chart: BaZiChart): FavorableResult {
  const strength = dayMasterStrength(chart);
  const dm: Element = strength.element;
  const dmHanzi = ELEMENT_HANZI[dm];
  const favorable: ElementAdvice[] = [];
  const unfavorable: ElementAdvice[] = [];

  if (strength.verdict === 'weak') {
    const yin = generatesFrom(dm);
    favorable.push({
      element: yin,
      role: '喜神',
      reason: `印绶生身：${ELEMENT_HANZI[yin]}生${dmHanzi}，扶弱日主`,
    });
    favorable.push({
      element: dm,
      role: '喜神',
      reason: `比劫帮身：${dmHanzi}助${dmHanzi}，增强日主之气`,
    });
    const guan = controlsFrom(dm);
    unfavorable.push({
      element: guan,
      role: '忌神',
      reason: `官杀攻身：${ELEMENT_HANZI[guan]}克${dmHanzi}，弱上加弱`,
    });
    const xie = GENERATES[dm];
    unfavorable.push({
      element: xie,
      role: '忌神',
      reason: `食伤泄气：${dmHanzi}生${ELEMENT_HANZI[xie]}，泄弱日主之气`,
    });
  } else if (strength.verdict === 'strong') {
    const xie = GENERATES[dm];
    favorable.push({
      element: xie,
      role: '喜神',
      reason: `食伤泄秀：${dmHanzi}生${ELEMENT_HANZI[xie]}，泄旺秀之气`,
    });
    const guan = controlsFrom(dm);
    favorable.push({
      element: guan,
      role: '喜神',
      reason: `官杀制身：${ELEMENT_HANZI[guan]}克${dmHanzi}，抑强为用`,
    });
    const cai = CONTROLS[dm];
    favorable.push({
      element: cai,
      role: '喜神',
      reason: `财星耗身：${dmHanzi}克${ELEMENT_HANZI[cai]}，耗旺日主之气`,
    });
    const yin = generatesFrom(dm);
    unfavorable.push({
      element: yin,
      role: '忌神',
      reason: `印绶助旺：${ELEMENT_HANZI[yin]}生${dmHanzi}，旺上加旺`,
    });
    unfavorable.push({
      element: dm,
      role: '忌神',
      reason: `比劫助旺：${dmHanzi}助${dmHanzi}，助纣为虐`,
    });
  }
  // 'balanced' (中和): no 扶抑 lean — favorable/unfavorable stay empty.

  // 调候: cold-season births need Fire, hot-season births need Water.
  const monthBranch = BRANCHES[chart.month.branch];
  const mainQi: Element = STEMS[monthBranch.hiddenStems[0]].element;
  let seasonal: SeasonalNeed;
  if (mainQi === 'Water' || monthBranch.hanzi === '丑') {
    seasonal = {
      element: 'Fire',
      reason: `月支${monthBranch.hanzi}寒湿，需火调候暖局`,
    };
  } else if (mainQi === 'Fire' || monthBranch.hanzi === '未') {
    // 未 is the last month of summer (三夏: 巳午未); its main qi is Earth,
    // but the season is still hot, so it needs Water like 巳/午.
    seasonal = {
      element: 'Water',
      reason: `月支${monthBranch.hanzi}炎热，需水调候济火`,
    };
  } else {
    seasonal = {
      element: null,
      reason: `月支${monthBranch.hanzi}季节平和，无调候急需`,
    };
  }

  return {
    dayMasterHanzi: strength.dayMasterHanzi,
    element: dm,
    verdictHanzi: strength.verdictHanzi,
    favorable,
    unfavorable,
    seasonal,
    source: SOURCE,
  };
}
