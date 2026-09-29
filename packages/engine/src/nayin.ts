/**
 * NaYin (纳音): the "elemental sound" of each of the 60 stem-branch pairs.
 *
 * Classical BaZi uses NaYin for the year pillar (年命, e.g. 甲子 = 海中金命)
 * and in ShenSha (神煞) lookups. The table below is the standard 60-entry
 * sequence in cycle order (甲子 = index 0 … 癸亥 = index 59).
 */
import type { Element } from './data.ts';
import { ganzhiIndex } from './cycle.ts';

export interface NaYin {
  /** NaYin name, e.g. '海中金'. */
  name: string;
  /** Its five-element (五行) attribute. */
  element: Element;
}

/** [name, element] in 六十甲子 order. */
const TABLE: Array<[string, Element]> = [
  ['海中金', 'Metal'], ['海中金', 'Metal'],
  ['炉中火', 'Fire'], ['炉中火', 'Fire'],
  ['大林木', 'Wood'], ['大林木', 'Wood'],
  ['路旁土', 'Earth'], ['路旁土', 'Earth'],
  ['剑锋金', 'Metal'], ['剑锋金', 'Metal'],
  ['山头火', 'Fire'], ['山头火', 'Fire'],
  ['涧下水', 'Water'], ['涧下水', 'Water'],
  ['城头土', 'Earth'], ['城头土', 'Earth'],
  ['白蜡金', 'Metal'], ['白蜡金', 'Metal'],
  ['杨柳木', 'Wood'], ['杨柳木', 'Wood'],
  ['泉中水', 'Water'], ['泉中水', 'Water'],
  ['屋上土', 'Earth'], ['屋上土', 'Earth'],
  ['霹雳火', 'Fire'], ['霹雳火', 'Fire'],
  ['松柏木', 'Wood'], ['松柏木', 'Wood'],
  ['长流水', 'Water'], ['长流水', 'Water'],
  ['沙中金', 'Metal'], ['沙中金', 'Metal'],
  ['山下火', 'Fire'], ['山下火', 'Fire'],
  ['平地木', 'Wood'], ['平地木', 'Wood'],
  ['壁上土', 'Earth'], ['壁上土', 'Earth'],
  ['金箔金', 'Metal'], ['金箔金', 'Metal'],
  ['覆灯火', 'Fire'], ['覆灯火', 'Fire'],
  ['天河水', 'Water'], ['天河水', 'Water'],
  ['大驿土', 'Earth'], ['大驿土', 'Earth'],
  ['钗钏金', 'Metal'], ['钗钏金', 'Metal'],
  ['桑柘木', 'Wood'], ['桑柘木', 'Wood'],
  ['大溪水', 'Water'], ['大溪水', 'Water'],
  ['沙中土', 'Earth'], ['沙中土', 'Earth'],
  ['天上火', 'Fire'], ['天上火', 'Fire'],
  ['石榴木', 'Wood'], ['石榴木', 'Wood'],
  ['大海水', 'Water'], ['大海水', 'Water'],
];

/** NaYin of a stem/branch pair (stem and branch indices). */
export function nayinOf(stem: number, branch: number): NaYin {
  const [name, element] = TABLE[ganzhiIndex(stem, branch)];
  return { name, element };
}
