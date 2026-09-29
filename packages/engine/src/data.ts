/**
 * Core BaZi data tables: Heavenly Stems (天干), Earthly Branches (地支),
 * hidden stems (藏干), and the Five Elements (五行).
 */

export type Polarity = 'yang' | 'yin';
export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface StemInfo {
  index: number;
  hanzi: string;
  pinyin: string;
  element: Element;
  polarity: Polarity;
}

/** The ten Heavenly Stems (天干), in order. */
export const STEMS: StemInfo[] = [
  { index: 0, hanzi: '甲', pinyin: 'Jia',  element: 'Wood',  polarity: 'yang' },
  { index: 1, hanzi: '乙', pinyin: 'Yi',   element: 'Wood',  polarity: 'yin'  },
  { index: 2, hanzi: '丙', pinyin: 'Bing', element: 'Fire',  polarity: 'yang' },
  { index: 3, hanzi: '丁', pinyin: 'Ding', element: 'Fire',  polarity: 'yin'  },
  { index: 4, hanzi: '戊', pinyin: 'Wu',   element: 'Earth', polarity: 'yang' },
  { index: 5, hanzi: '己', pinyin: 'Ji',   element: 'Earth', polarity: 'yin'  },
  { index: 6, hanzi: '庚', pinyin: 'Geng', element: 'Metal', polarity: 'yang' },
  { index: 7, hanzi: '辛', pinyin: 'Xin',  element: 'Metal', polarity: 'yin'  },
  { index: 8, hanzi: '壬', pinyin: 'Ren',  element: 'Water', polarity: 'yang' },
  { index: 9, hanzi: '癸', pinyin: 'Gui',  element: 'Water', polarity: 'yin'  },
];

export interface BranchInfo {
  index: number;
  hanzi: string;
  pinyin: string;
  zodiac: string;
  element: Element;
  polarity: Polarity;
  /** Hidden heavenly stems (藏干) as stem indices, main qi first. */
  hiddenStems: number[];
}

/** The twelve Earthly Branches (地支), in order. */
export const BRANCHES: BranchInfo[] = [
  { index: 0,  hanzi: '子', pinyin: 'Zi',   zodiac: 'Rat',     element: 'Water', polarity: 'yang', hiddenStems: [9] },
  { index: 1,  hanzi: '丑', pinyin: 'Chou', zodiac: 'Ox',      element: 'Earth', polarity: 'yin',  hiddenStems: [5, 9, 7] },
  { index: 2,  hanzi: '寅', pinyin: 'Yin',  zodiac: 'Tiger',   element: 'Wood',  polarity: 'yang', hiddenStems: [0, 2, 4] },
  { index: 3,  hanzi: '卯', pinyin: 'Mao',  zodiac: 'Rabbit',  element: 'Wood',  polarity: 'yin',  hiddenStems: [1] },
  { index: 4,  hanzi: '辰', pinyin: 'Chen', zodiac: 'Dragon',  element: 'Earth', polarity: 'yang', hiddenStems: [4, 1, 9] },
  { index: 5,  hanzi: '巳', pinyin: 'Si',   zodiac: 'Snake',   element: 'Fire',  polarity: 'yin',  hiddenStems: [2, 6, 4] },
  { index: 6,  hanzi: '午', pinyin: 'Wu',   zodiac: 'Horse',   element: 'Fire',  polarity: 'yang', hiddenStems: [3, 5] },
  { index: 7,  hanzi: '未', pinyin: 'Wei',  zodiac: 'Goat',    element: 'Earth', polarity: 'yin',  hiddenStems: [5, 3, 1] },
  { index: 8,  hanzi: '申', pinyin: 'Shen', zodiac: 'Monkey',  element: 'Metal', polarity: 'yang', hiddenStems: [6, 8, 4] },
  { index: 9,  hanzi: '酉', pinyin: 'You',  zodiac: 'Rooster', element: 'Metal', polarity: 'yin',  hiddenStems: [7] },
  { index: 10, hanzi: '戌', pinyin: 'Xu',   zodiac: 'Dog',     element: 'Earth', polarity: 'yang', hiddenStems: [4, 7, 3] },
  { index: 11, hanzi: '亥', pinyin: 'Hai',  zodiac: 'Pig',     element: 'Water', polarity: 'yin',  hiddenStems: [8, 0] },
];
