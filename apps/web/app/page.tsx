'use client';

import { useState } from 'react';
import {
  calculateBaZi,
  luckPillars,
  annualPillar,
  baziYearAt,
  tenGod,
  TEN_GOD_INFO,
  STEMS,
  BRANCHES,
  type BaZiChart,
  type Gender,
  type LuckPillar,
  type Pillar,
  type Element,
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

function PillarCard({ pillar, label, dayMaster, highlight }: {
  pillar: Pillar; label: string; dayMaster: number; highlight?: boolean;
}) {
  const stem = STEMS[pillar.stem];
  const branch = BRANCHES[pillar.branch];
  const god = tenGod(dayMaster, pillar.stem);
  return (
    <div className={`pillar${highlight ? ' daymaster' : ''}`}>
      <div className="pname">{label}</div>
      <div className="hanzi">{pillar.hanzi}</div>
      <div className="pinyin">{stem.pinyin} {branch.pinyin}</div>
      <div className="god">{god} · {TEN_GOD_INFO[god].english}</div>
      <div className="hidden-stems">
        藏干 {branch.hiddenStems.map((s) => (
          <span key={s}>
            <b>{STEMS[s].hanzi}</b> {tenGod(dayMaster, s)}{' '}
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
    chart: BaZiChart; luck: LuckPillar[]; annual: Pillar; flowYear: number; ageYears: number;
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
      const luck: LuckPillar[] = luckPillars({ ...input, gender });
      const now = new Date();
      const flowYear = baziYearAt(now);
      const annual = annualPillar(flowYear);
      const ageYears = (now.getTime() - new Date(`${date}T00:00:00`).getTime()) / 31_557_600_000;
      setError('');
      setResult({ chart, luck, annual, flowYear, ageYears });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const offsets: string[] = [];
  for (let h = -12; h <= 14; h += 0.5) offsets.push(String(h));

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
                  pillar={result.chart[key]}
                  label={label}
                  dayMaster={result.chart.dayMaster}
                  highlight={key === 'day'}
                />
              ))}
            </div>
          </div>

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
            <p className="meta">The flowing year begins at Lichun (立春), not January 1.</p>
          </div>

          <p className="note">
            Year and month pillars switch at astronomical solar-term instants (computed from the
            sun&apos;s apparent ecliptic longitude, accurate to a few minutes). Day and hour pillars
            use local solar time from birthplace longitude; the equation of time is not applied.
          </p>
        </>
      )}
    </>
  );
}
