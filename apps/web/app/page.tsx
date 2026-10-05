'use client';

import { useState } from 'react';
import {
  calculateBaZi,
  readChart,
  evaluateRules,
  elementBalance,
  luckPillars,
  dayMasterStrength,
  favorableElements,
  annualPillar,
  baziYearAt,
  tenGod,
  nayinOf,
  personalityTraits,
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
  type PersonalityTrait,
  type TenGod,
} from '@bazi/engine';

const ELEMENT_HANZI: Record<Element, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

type Lang = 'en' | 'zh';

const STR: Record<Lang, Record<string, string>> = {
  en: {
    title: 'BaZi Calculator · 八字排盘',
    subtitle: 'Four Pillars of Destiny with astronomical solar terms — enter a birth moment, get the full chart.',
    toggle: '中文',
    birthDetails: 'Birth details',
    birthDate: 'Birth date',
    birthTime: 'Birth time (clock)',
    timezone: 'Clock timezone (UTC offset)',
    longitude: 'Birthplace longitude °E (solar-time correction)',
    male: 'Male 男',
    female: 'Female 女',
    calculate: 'Calculate 排盘',
    fourPillars: 'Four pillars 四柱',
    dayMaster: 'Day Master 日主',
    tenGods: 'Ten Gods 十神 · stems and hidden stems',
    structure: 'Chart structure 合冲害',
    strength: 'Day Master strength 旺衰 · favorable elements 喜用',
    personality: 'Dominant temperaments 性格',
    balance: 'Five-element balance 五行 (stems + branches)',
    luck: 'Luck pillars 大运',
    forward: '顺行 forward',
    backward: '逆行 backward',
    annual: 'Annual pillar 流年',
  },
  zh: {
    title: '八字排盘',
    subtitle: '以天文节气排八字——输入出生时刻，得到完整命盘。',
    toggle: 'English',
    birthDetails: '出生信息',
    birthDate: '出生日期',
    birthTime: '出生时间',
    timezone: '时区（UTC 偏移）',
    longitude: '出生地经度 °E（真太阳时校正）',
    male: '男',
    female: '女',
    calculate: '排盘',
    fourPillars: '四柱',
    dayMaster: '日主',
    tenGods: '十神',
    structure: '格局 合冲害',
    strength: '旺衰 · 喜用',
    personality: '性格',
    balance: '五行平衡',
    luck: '大运',
    forward: '顺行',
    backward: '逆行',
    annual: '流年',
  },
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

function StructureCard({ hits, t }: { hits: RuleHit[]; t: Record<string, string> }) {
  return (
    <div className="card">
      <h2>{t.structure}</h2>
      {hits.length === 0 ? (
        <p className="meta">No stem combinations, branch combinations, clashes, or harms 合/冲/害 found in this chart.</p>
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

function StrengthCard({ strength, favorable, t }: {
  strength: StrengthResult; favorable: FavorableResult; t: Record<string, string>;
}) {
  return (
    <div className="card">
      <h2>{t.strength}</h2>
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

function PersonalityCard({ traits, t }: { traits: PersonalityTrait[]; t: Record<string, string> }) {
  return (
    <div className="card">
      <h2>{t.personality}</h2>
      {traits.length === 0 ? (
        <p className="meta">No Ten God data to read.</p>
      ) : (
        <ul className="rule-list">
          {traits.map((t) => (
            <li key={t.god}>
              <b>{t.god} · {t.english}</b> × {t.count}
              <span className="meta">
                {' '}— {t.keywords.join(' · ')} · {t.keywordsZh.join('、')}
                {' '}({t.expression} {t.expressionZh})
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="meta">
        Top Ten Gods by count across pillar stems and hidden stems — conventional
        shorthand hints, not predictions. Expression follows the Day Master strength verdict.
      </p>
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
  const [lang, setLang] = useState<Lang>('en');
  const t = STR[lang];
  const [date, setDate] = useState('2000-06-15');
  const [time, setTime] = useState('12:00');
  const [utcOffset, setUtcOffset] = useState('8');
  const [longitude, setLongitude] = useState('120');
  const [gender, setGender] = useState<Gender>('male');
  const [result, setResult] = useState<{
    chart: BaZiChart; reading: ChartReading; structure: RuleHit[]; luck: LuckPillar[]; annual: Pillar; flowYear: number; ageYears: number;
    strength: StrengthResult; favorable: FavorableResult; personality: PersonalityTrait[];
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
      const personality: PersonalityTrait[] = personalityTraits(reading, strength.verdict);
      const now = new Date();
      const flowYear = baziYearAt(now);
      const annual = annualPillar(flowYear);
      const ageYears = (now.getTime() - new Date(`${date}T00:00:00`).getTime()) / 31_557_600_000;
      setError('');
      setResult({ chart, reading, structure, luck, annual, flowYear, ageYears, strength, favorable, personality });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t.title}</h1>
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          style={{ height: 'fit-content', padding: '0.4rem 0.9rem' }}
        >
          {t.toggle}
        </button>
      </div>
      <p className="subtitle">
        {t.subtitle}
      </p>

      <div className="card">
        <h2>{t.birthDetails}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>{t.birthDate}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>{t.birthTime}</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="field">
              <label>{t.timezone}</label>
              <select value={utcOffset} onChange={(e) => setUtcOffset(e.target.value)}>
                {offsets.map((o) => (
                  <option key={o} value={o}>
                    UTC{o.startsWith('-') ? o : `+${o}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.longitude}</label>
              <input
                type="number" step="0.1" min="-180" max="180"
                value={longitude} onChange={(e) => setLongitude(e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="radio-row">
              <label><input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> {t.male}</label>
              <label><input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> {t.female}</label>
            </div>
          </div>
          <button className="primary" type="submit">{t.calculate}</button>
        </form>
        {error && <p style={{ color: '#a33' }}>{error}</p>}
      </div>

      {result && (
        <>
          <div className="card">
            <h2>
              {t.fourPillars} · {t.dayMaster}{' '}
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
            <h2>{t.tenGods}</h2>
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

          <StructureCard hits={result.structure} t={t} />

          <StrengthCard strength={result.strength} favorable={result.favorable} t={t} />

          <PersonalityCard traits={result.personality} t={t} />

          <div className="card">
            <h2>{t.balance}</h2>
            <div className="element-bar">
              {(Object.keys(ELEMENT_HANZI) as Element[]).map((el) => (
                <span key={el} className="element-chip">
                  {ELEMENT_HANZI[el]} {el} × {elementBalance(result.chart)[el]}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>
              {t.luck} · {result.luck[0].direction === 'forward' ? t.forward : t.backward}
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
                    <div className="hidden-stems">
                      藏干{' '}
                      {BRANCHES[lp.branch].hiddenStems.map((s) => (
                        <span key={s}>
                          <b>{STEMS[s].hanzi}</b> {tenGod(result.chart.dayMaster, s)}{' '}
                        </span>
                      ))}
                    </div>
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
            <h2>{t.annual}</h2>
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
