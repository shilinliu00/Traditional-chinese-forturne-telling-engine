/**
 * Personality mapping: first-order temperament reading from the Ten Gods (十神).
 *
 * Counts each Ten God across the four pillar stems plus every hidden stem
 * (藏干), then takes the top three as the chart's dominant temperaments.
 * The Day Master strength verdict modulates how the traits express:
 * a strong 日主 lets a god show unrestrained, a weak one holds it back.
 *
 * The keyword sets are the conventional Ten God associations used across
 * classical BaZi literature; keep them as shorthand hints, not predictions.
 */
import { TEN_GOD_INFO, type TenGod } from './tenGods.ts';
import type { ChartReading, PillarReading } from './reading.ts';
import type { StrengthVerdict } from './strength.ts';

export interface PersonalityTrait {
  god: TenGod;
  pinyin: string;
  english: string;
  /** occurrences across pillar stems + hidden stems */
  count: number;
  /** conventional personality keywords */
  keywords: string[];
  keywordsZh: string[];
  /** how the verdict modulates this trait */
  expression: string;
  expressionZh: string;
}

const KEYWORDS: Record<TenGod, { en: string[]; zh: string[] }> = {
  '比肩': { en: ['independent', 'loyal', 'competitive'], zh: ['独立', '讲义气', '好胜'] },
  '劫财': { en: ['bold', 'generous', 'impulsive'], zh: ['果敢', '慷慨', '急躁'] },
  '食神': { en: ['easygoing', 'creative', 'optimistic'], zh: ['随和', '有才艺', '乐观'] },
  '伤官': { en: ['expressive', 'unconventional', 'sharp'], zh: ['表达欲强', '不拘一格', '锋芒外露'] },
  '偏财': { en: ['adaptable', 'opportunistic', 'sociable'], zh: ['圆滑', '善于抓机会', '交际广'] },
  '正财': { en: ['steady', 'thrifty', 'reliable'], zh: ['踏实', '节俭', '靠谱'] },
  '七杀': { en: ['decisive', 'driven', 'intense'], zh: ['果断', '有魄力', '气场强'] },
  '正官': { en: ['principled', 'responsible', 'disciplined'], zh: ['守规矩', '有担当', '自律'] },
  '偏印': { en: ['intuitive', 'thoughtful', 'withdrawn'], zh: ['直觉强', '深思', '内敛'] },
  '正印': { en: ['kind', 'patient', 'traditional'], zh: ['仁慈', '耐心', '重传统'] },
};

function expressionFor(verdict: StrengthVerdict): { en: string; zh: string } {
  if (verdict === 'strong') return { en: 'unrestrained', zh: '外放' };
  if (verdict === 'weak') return { en: 'held back', zh: '内敛' };
  return { en: 'steady', zh: '平和' };
}

/** Count each Ten God across pillar stems and hidden stems. */
export function countTenGods(reading: ChartReading): Record<TenGod, number> {
  const counts = Object.fromEntries(
    (Object.keys(TEN_GOD_INFO) as TenGod[]).map((g) => [g, 0]),
  ) as Record<TenGod, number>;
  const tally = (pillar: PillarReading): void => {
    counts[pillar.tenGod] += 1;
    for (const god of pillar.hiddenGods) counts[god] += 1;
  };
  tally(reading.year);
  tally(reading.month);
  tally(reading.day);
  tally(reading.hour);
  return counts;
}

/**
 * Top three dominant Ten God temperaments for a chart reading,
 * ranked by occurrence count (ties break in hanzi code point order for
 * stability, since the keys are hanzi rather than an alphabet).
 */
export function personalityTraits(
  reading: ChartReading,
  verdict: StrengthVerdict,
): PersonalityTrait[] {
  const counts = countTenGods(reading);
  const expression = expressionFor(verdict);
  return (Object.keys(TEN_GOD_INFO) as TenGod[])
    .map((god) => ({
      god,
      pinyin: TEN_GOD_INFO[god].pinyin,
      english: TEN_GOD_INFO[god].english,
      count: counts[god],
      keywords: KEYWORDS[god].en,
      keywordsZh: KEYWORDS[god].zh,
      expression: expression.en,
      expressionZh: expression.zh,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || (a.god < b.god ? -1 : 1))
    .slice(0, 3);
}
