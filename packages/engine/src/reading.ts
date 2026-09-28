/**
 * Chart reading (排盘解读): annotate each pillar's stem with its Ten God
 * (十神) relationship to the Day Master (日主), so callers get the full
 * interpreted chart from a single call instead of combining
 * `calculateBaZi` + `tenGod` themselves.
 */
import { calculateBaZi, type BaZiChart, type BirthInput, type Pillar } from './pillars.ts';
import { tenGod, type TenGod } from './tenGods.ts';

export interface PillarReading extends Pillar {
  /** Ten God (十神) of this pillar's stem relative to the Day Master. */
  tenGod: TenGod;
}

export interface ChartReading {
  year: PillarReading;
  month: PillarReading;
  day: PillarReading;
  hour: PillarReading;
  /** Day Master (日主) stem index. */
  dayMaster: number;
  /** Day Master stem hanzi, e.g. '甲'. */
  dayMasterHanzi: string;
}

function annotate(chart: BaZiChart, pillar: Pillar): PillarReading {
  return { ...pillar, tenGod: tenGod(chart.dayMaster, pillar.stem) };
}

/** Full four-pillar chart with Ten Gods resolved against the Day Master. */
export function readChart(input: BirthInput): ChartReading {
  const chart = calculateBaZi(input);
  return {
    year: annotate(chart, chart.year),
    month: annotate(chart, chart.month),
    day: annotate(chart, chart.day),
    hour: annotate(chart, chart.hour),
    dayMaster: chart.dayMaster,
    dayMasterHanzi: chart.day.hanzi[0],
  };
}
