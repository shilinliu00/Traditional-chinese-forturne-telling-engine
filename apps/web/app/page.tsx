'use client';

import { useState } from 'react';
import {
  calculateBaZi,
  readChart,
  evaluateRules,
  luckPillars,
  dayMasterStrength,
  favorableElements,
  annualPillar,
  baziYearAt,
  tenGod,
  nayinOf,
  TEN_GOD_INFO,
  STEMS,
  BRANCHES,
  type BaZiChart,
  type ChartReading,
  type PillarReading,
  type RuleHit,
  type Gender,
  type LuckPillar,
  type Pillar,
  type Element,
  type StrengthResult,
  type FavorableResult,
  type TenGod,
} from '@bazi/engine';

const ELEMENT_HANZI: Record<Element, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

const PILLAR_LABELS = [
  { key: 'year', label: 'Year 年柱' },
  { key: 'month', label: 'Month 月柱' },
  { key: 'day', label: 'Day 日柱' },
  { key: 'hour', label: 'Hour 时柱' },
] as const;

const PILLAR_ZH: Record<string, string> = {
  year: '年柱', month: '月柱', day: '日柱', hour: '时柱',
};

function StructureCard({ hits }: { hits: RuleHit[] }) {
  return (
    <div className="card">
      <h2>Chart structure 合冲</h2>
      {hits.length === 0 ? (
        <p className="meta">No stem combinations, branch combinations, or clashes 合/冲 found in this chart.</p>
      ) : (
        <ul className="rule-list">
          {hits.map((hit, i) => (
            <li key={i}>
              <b>{hit.name}</b> · {hit.pattern}
              <span className="meta">
                {' '}({hit.pillars.map((p) => PILLAR_ZH[p]).join('、')} · {hit.factors.join('，')})
              </span>
              <span className="meta"> — {hit.source}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StrengthCard({ strength, favorable }: {
  strength: StrengthResult; favorable: FavorableResult;
}) {
  return (
    <div className="card">
      <h2>Day Master strength 旺衰 · favorable elements 喜用</h2>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>
        日主 {strength.dayMasterHanzi}（{ELEMENT_HANZI[strength.element]}）· {strength.verdictHanzi}
        <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--muted)' }}>
          {' '}score {strength.score} / {strength.max}
        </span>
      </p>
      <ul className="rule-list">
        {strength.criteria.map((c) => (
          <li key={c.name}>
            <b>{c.name}</b> +{c.points}
            <span className="meta"> — {c.factors.join('；')}</span>
          </li>
        ))}
      </ul>
      {favorable.favorable.length > 0 && (
        <p>
          <b>喜神 favorable:</b>{' '}
          {favorable.favorable.map((a) => `${ELEMENT_HANZI[a.element]} ${a.element}`).join('、')}
          <span className="meta"> — {favorable.favorable.map((a) => a.reason).join('；')}</span>
        </p>
      )}
      {favorable.unfavorable.length > 0 && (
        <p>
          <b>忌神 unfavorable:</b>{' '}
          {favorable.unfavorable.map((a) => `${ELEMENT_HANZI[a.element]} ${a.element}`).join('、')}
          <span className="meta"> — {favorable.unfavorable.map((a) => a.reason).join('；')}</span>
        </p>
      )}
      <p>
        <b>调候 seasonal:</b>{' '}
        {favorable.seasonal.element
          ? `${ELEMENT_HANZI[favorable.seasonal.element]} ${favorable.seasonal.element}`
          : '—'}
        <span className="meta"> — {favorable.seasonal.reason}</span>
      </p>
      <p className="meta">First-order 扶抑 + 调候 aid from the strength verdict — {favorable.source}.</p>
    </div>
  );
}

function PillarCard({ reading, label, highlight }: {
  reading: PillarReading; label: string; highlight?: boolean;
}) {
  const stem = STEMS[reading.stem];
  const branch = BRANCHES[reading.branch];
  const god = reading.tenGod;
  return (
    <div className={`pillar${highlight ? ' daymaster' : ''}`}>
      <div className="pname">{label}</div>
      <div className="hanzi">{reading.hanzi}</div>
      <div className="pinyin">{stem.pinyin} {branch.pinyin}</div>
      <div className="god">{god} · {TEN_GOD_INFO[god].english}</div>
      <div className="nayin">纳音 {reading.nayin.name} ({ELEMENT_HANZI[reading.nayin.element]})</div>
      <div className="hidden-stems">
        藏干 {branch.hiddenStems.map((s, i) => (
          <span key={s}>
            <b>{STEMS[s].hanzi}</b> {reading.hiddenGods[i]}{' '}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [date, setDate] = useState('2000-06-15');
  const [time, setTime] = useState('12:00');
  const [utcOffset, setUtcOffset] = useState('8');
  const [longitude, setLongitude] = useState('120');
  const [gender, setGender] = useState<Gender>('male');
  const [result, setResult] = useState<{
    chart: BaZiChart; reading: ChartReading; structure: RuleHit[]; luck: LuckPillar[]; annual: Pillar; flowYear: number; ageYears: number;
    strength: StrengthResult; favorable: FavorableResult;
  } | null>(null);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const input = {
        date,
        time,
        longitude: longitude.trim() === '' ? undefined : Number(longitude),
        utcOffsetMinutes: Number(utcOffset) * 60,
      };
      const chart: BaZiChart = calculateBaZi(input);
      const reading: ChartReading = readChart(input);
      const structure: RuleHit[] = evaluateRules(chart);
      const luck: LuckPillar[] = luckPillars({ ...input, gender });
      const strength: StrengthResult = dayMasterStrength(chart);
      const favorable: FavorableResult = favorableElements(chart);
      const now = new Date();
      const flowYear = baziYearAt(now);
      const annual = annualPillar(flowYear);
      const ageYears = (now.getTime() - new Date(`${date}T00:00:00`).getTime()) / 31_557_600_000;
      setError('');
      setResult({ chart, reading, structure, luck, annual, flowYear, ageYears, strength, favorable });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const offsets: string[] = [];
  for (let h = -12; h <= 14; h += 0.5) offsets.push(String(h));

  const godCounts: Array<{ god: TenGod; count: number }> = result
    ? (Object.keys(TEN_GOD_INFO) as TenGod[])
        .map((g) => ({
          god: g,
          count: (['year', 'month', 'day', 'hour'] as const).reduce(
            (n, k) =>
              n +
              (result.reading[k].tenGod === g ? 1 : 0) +
              result.reading[k].hiddenGods.filter((h) => h === g).length,
            0,
          ),
        }))
        .filter((x) => x.count > 0)
    : [];

  return (
    <>
      <h1>BaZi Calculator · 八字排盘</h1>
      <p className="subtitle">
        Four Pillars of Destiny with astronomical solar terms — enter a birth moment, get the full chart.
      </p>

      <div className="card">
        <h2>Birth details</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Birth date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Birth time (clock)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="field">
              <label>Clock timezone (UTC offset)</label>
              <select value={utcOffset} onChange={(e) => setUtcOffset(e.target.value)}>
                {offsets.map((o) => (
                  <option key={o} value={o}>
                    UTC{o.startsWith('-') ? o : `+${o}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Birthplace longitude °E (solar-time correction)</label>
              <input
                type="number" step="0.1" min="-180" max="180"
                value={longitude} onChange={(e) => setLongitude(e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="radio-row">
              <label><input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> Male 男</label>
              <label><input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> Female 女</label>
            </div>
          </div>
          <button className="primary" type="submit">Calculate 排盘</button>
        </form>
        {error && <p style={{ color: '#a33' }}>{error}</p>}
      </div>

      {result && (
        <>
          <div className="card">
            <h2>
              Four pillars 四柱 · Day Master 日主{' '}
              {STEMS[result.chart.dayMaster].hanzi} ({STEMS[result.chart.dayMaster].pinyin})
            </h2>
            <div className="pillars">
              {PILLAR_LABELS.map(({ key, label }) => (
                <PillarCard
                  key={key}
                  reading={result.reading[key]}
                  label={label}
                  highlight={key === 'day'}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Ten Gods 十神 · stems and hidden stems</h2>
            <div className="element-bar">
              {godCounts.map(({ god, count }) => (
                <span key={god} className="element-chip">
                  {god} {TEN_GOD_INFO[god].english} × {count}
                </span>
              ))}
            </div>
            <p className="meta">
              Counts the four pillar stems plus every hidden stem （藏干） in the four branches,
              each resolved against the Day Master.
            </p>
          </div>

          <StructureCard hits={result.structure} />

          <StrengthCard strength={result.strength} favorable={result.favorable} />

          <div className="card">
            <h2>Five-element balance 五行 (stems + branches)</h2>
            <div className="element-bar">
              {(Object.keys(ELEMENT_HANZI) as Element[]).map((el) => {
                const count = (['year', 'month', 'day', 'hour'] as const).reduce(
                  (n, k) =>
                    n +
                    (STEMS[result.chart[k].stem].element === el ? 1 : 0) +
                    (BRANCHES[result.chart[k].branch].element === el ? 1 : 0),
                  0,
                );
                return (
                  <span key={el} className="element-chip">
                    {ELEMENT_HANZI[el]} {el} × {count}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2>
              Luck pillars 大运 · {result.luck[0].direction === 'forward' ? '顺行 forward' : '逆行 backward'}
            </h2>
            <div className="luck-list">
              {result.luck.map((lp, i) => {
                const next = result.luck[i + 1];
                const current = result.ageYears >= lp.startAge && (!next || result.ageYears < next.startAge);
                return (
                  <div key={i} className={`luck-item${current ? ' current' : ''}`}>
                    <div className="hanzi">{lp.hanzi}</div>
                    <div className="age">from {lp.startAge.toFixed(1)} yrs</div>
                    <div className="god">{tenGod(result.chart.dayMaster, lp.stem)}</div>
                    <div className="nayin">纳音 {nayinOf(lp.stem, lp.branch).name}</div>
                  </div>
                );
              })}
            </div>
            <p className="meta">
              Start ages use the 三天折合一岁 rule (3 days = 1 year) from the birth moment to the
              neighboring Jie (节) term instant.
            </p>
          </div>

          <div className="card">
            <h2>Annual pillar 流年</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>
              {result.annual.hanzi}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--muted)' }}>
                {STEMS[result.annual.stem].pinyin} {BRANCHES[result.annual.branch].pinyin} · flowing year {result.flowYear}
              </span>
            </p>
            <p className="meta">
              {tenGod(result.chart.dayMaster, result.annual.stem)}{' '}
              {TEN_GOD_INFO[tenGod(result.chart.dayMaster, result.annual.stem)].english} vs Day Master · 纳音{' '}
              {nayinOf(result.annual.stem, result.annual.branch).name}
            </p>
            <p className="meta">
              藏干{' '}
              {BRANCHES[result.annual.branch].hiddenStems.map((s) => (
                <span key={s}>
                  <b>{STEMS[s].hanzi}</b> {tenGod(result.chart.dayMaster, s)}{' '}
                </span>
              ))}
            </p>
            <p className="meta">The flowing year begins at Lichun (立春), not January 1.</p>
          </div>

          <p className="note">
            Year and month pillars switch at astronomical solar-term instants (computed from the
            sun&apos;s apparent ecliptic longitude, accurate to a few minutes). Day and hour pillars
            use true local solar time from birthplace longitude: the longitude meridian correction
            plus the equation of time (up to ±16 minutes, Meeus ch. 28) both apply.
          </p>
        </>
      )}
    </>
  );
}
