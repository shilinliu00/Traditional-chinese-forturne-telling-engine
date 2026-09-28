/**
 * Ten Gods (十神): the relationship of any stem to the Day Master (日主),
 * derived from Five-Element interactions and yin/yang polarity.
 */
import { STEMS } from './data.ts';
import { generates, controls } from './elements.ts';

export type TenGod =
  | '比肩' | '劫财'   // peer: same element
  | '食神' | '伤官'   // output: day master generates
  | '偏财' | '正财'   // wealth: day master controls
  | '七杀' | '正官'   // power: controls day master
  | '偏印' | '正印';  // resource: generates day master

export const TEN_GOD_INFO: Record<TenGod, { pinyin: string; english: string }> = {
  '比肩': { pinyin: 'Bijian',    english: 'Friend' },
  '劫财': { pinyin: 'Jiecai',    english: 'Rob Wealth' },
  '食神': { pinyin: 'Shishen',   english: 'Eating God' },
  '伤官': { pinyin: 'Shangguan', english: 'Hurting Officer' },
  '偏财': { pinyin: 'Piancai',   english: 'Indirect Wealth' },
  '正财': { pinyin: 'Zhengcai',  english: 'Direct Wealth' },
  '七杀': { pinyin: 'Qisha',     english: 'Seven Killings' },
  '正官': { pinyin: 'Zhengguan', english: 'Direct Officer' },
  '偏印': { pinyin: 'Pianyin',   english: 'Indirect Resource' },
  '正印': { pinyin: 'Zhengyin',  english: 'Direct Resource' },
};

/**
 * Ten God of `stem` relative to `dayMaster` (both stem indices 0–9).
 * Same polarity → the "indirect/偏" or peer variant; different polarity →
 * the "direct/正" variant.
 */
export function tenGod(dayMaster: number, stem: number): TenGod {
  const dm = STEMS[dayMaster];
  const s = STEMS[stem];
  const samePolarity = dm.polarity === s.polarity;

  if (dm.element === s.element) return samePolarity ? '比肩' : '劫财';
  if (generates(dm.element, s.element)) return samePolarity ? '食神' : '伤官';
  if (generates(s.element, dm.element)) return samePolarity ? '偏印' : '正印';
  if (controls(dm.element, s.element)) return samePolarity ? '偏财' : '正财';
  return samePolarity ? '七杀' : '正官'; // controls(s.element, dm.element)
}
