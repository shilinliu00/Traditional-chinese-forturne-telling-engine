# BaZi Calculator (八字排盘)

A full-stack BaZi (Four Pillars of Destiny, 四柱八字) chart calculator and interpreter — a portfolio project combining Chinese metaphysics with real computer science: calendar algorithms, astronomical solar terms, and a rule-based interpretation engine.

Enter a birth date, time, and birthplace → get the complete four-pillar chart (year 年柱, month 月柱, day 日柱, hour 时柱) with hidden stems, Ten Gods (十神), Five Element (五行) analysis, luck pillars (大运), and the current annual pillar (流年).

## Monorepo layout

```
bazi-calculator/
├── packages/
│   └── engine/          # @bazi/engine — pure TypeScript calculation engine (no dependencies)
│       ├── src/
│       │   ├── data.ts        # Stems, branches, hidden stems, elements
│       │   ├── cycle.ts       # Sexagenary cycle (六十甲子) math
│       │   ├── elements.ts    # Five-element generating/controlling cycles
│       │   ├── tenGods.ts     # Ten Gods (十神) relations vs. the Day Master
│       │   ├── nayin.ts       # NaYin (纳音) elemental sounds of the 60 pairs
│       │   ├── solarTerms.ts  # Astronomical solar-term instants (sun's ecliptic longitude)
│       │   ├── pillars.ts     # Year/month/day/hour pillar calculation
│       │   ├── luckPillars.ts # Luck pillars (大运) + annual pillars (流年)
│       │   ├── reading.ts     # Chart readings: Ten Gods, NaYin, hidden-stem gods
│       │   ├── rules.ts       # Structural rules (合/冲/害) with evidence + classical sources
│       │   └── index.ts       # Public API
│       └── tests/
└── apps/
    └── web/             # @bazi/web — Next.js chart UI (imports @bazi/engine)
```

## Run the engine tests

```bash
npm test   # node --test packages/engine/tests/*.test.ts
```

No dependencies, no build step — Node 22+ runs the TypeScript directly via type stripping.

## API usage

```ts
import { calculateBaZi, readChart, luckPillars } from './packages/engine/src/index.ts';

// Four pillars (throws on impossible dates like 2023-02-29 or times like 25:00)
const chart = calculateBaZi({ date: '2024-01-01', time: '12:00', longitude: 116 });
// → { year: '癸卯', month: '甲子', day: '甲子', hour: '庚午', dayMaster: 0 }

// Same chart with each stem's Ten God (十神) resolved against the Day Master,
// plus NaYin (纳音) and hidden-stem (藏干) Ten Gods per pillar
const reading = readChart({ date: '2024-01-01', time: '12:00' });
// → year: 癸卯 (正印, 金箔金, 藏干[劫财]), month: 甲子 (比肩, 海中金, 藏干[正印]),
//   day: 甲子 (比肩, 海中金, 藏干[正印]), hour: 庚午 (七杀, 路旁土, 藏干[伤官, 正财])

// Structural rules (合/冲/害): each hit keeps its evidence and classical source
import { evaluateRules } from './packages/engine/src/index.ts';
const hits = evaluateRules(chart);
// → [{ rule: 'triple-combination', pattern: '申子辰合水局',
//      pillars: ['year','month','day'], factors: ['年支申','月支子','日支辰'],
//      source: '《三命通会》' }, …]

// Luck pillars (大运), direction from year-stem polarity × gender
const lucks = luckPillars({ date: '2024-01-01', time: '12:00', gender: 'male' });

// Day Master strength (旺衰): 得令/得地/得势 scoring with evidence
import { dayMasterStrength, favorableElements } from './packages/engine/src/index.ts';
const strength = dayMasterStrength(chart);
// → { dayMasterHanzi: '甲', element: 'Wood', score: 5.5, verdictHanzi: '身旺', … }

// Favorable elements (喜用神/忌神) + seasonal 调候, from the strength verdict
const fav = favorableElements(chart);
// → { verdictHanzi: '身旺', favorable: [火(食伤泄秀), 金(官杀制身), 土(财星耗身)],
//     unfavorable: [水(印), 木(比劫)], seasonal: { element: null, … } }
```

## Run the web app

```bash
cd apps/web
npm install
npm run dev    # → http://localhost:3000
```

## Share links

A chart can be shared as a plain link — the web UI reads the birth inputs from
the URL query string on load, pre-fills the form, and runs the chart:

```
/?date=2000-12-01&time=07:30&tz=-5&lon=-73.9&gender=female&lang=en
```

`encodeShareParams` / `decodeShareParams` in `packages/engine/src/share.ts` build
and validate the query string (bad values decode to `null` and the link is
ignored). The "Copy share link" button in the UI generates the link from the
current form inputs.

## Calculation highlights

- **Year pillar** changes at the astronomical instant of Lichun (立春 ≈ Feb 4), not Jan 1 or Lunar New Year — the classic beginner trap, handled to the minute.
- **Month pillar** follows the 12 Jie (节) solar terms via the Five Tigers rule (五虎遁), not lunar months.
- **Solar terms** are computed astronomically: the sun's apparent ecliptic longitude (Meeus-style low-precision coordinates + aberration/nutation) solved for each 15° crossing with Newton iteration.
- **Day pillar** is a continuous 60-day cycle anchored to a verified reference: 2024-01-01 = 甲子日 (cross-checked against published perpetual calendars).
- **Hour pillar** uses the Five Rats rule (五鼠遁), with true-solar-time correction from birthplace longitude — longitude offset (1° = 4 min) plus the equation of time (Meeus ch. 28, ±16 min seasonal; verified against published anchors) — and the late-子时 rule (23:00–24:00 belongs to the next day).
- **NaYin (纳音)**: the elemental sound of each pillar's stem-branch pair (e.g. 癸卯 = 金箔金), included in chart readings.
- **Hidden stems (藏干)**: each branch's hidden stems resolved to Ten Gods vs. the Day Master, main qi first.
- **Day Master strength (旺衰)** and **favorable elements (喜用神/忌神)**: `dayMasterStrength()` scores the classical 得令/得地/得势 criteria with evidence factors; `favorableElements()` derives a first-order 扶抑 recommendation (身弱喜印比、身旺喜食伤官杀财) plus the birth season's 调候 need (cold months → Fire, hot months → Water). Both are shown in the web UI.
- **Structural rules (合/冲/害)**: `evaluateRules()` detects 天干五合, 地支六合, 三合局, 三会方, 六冲, and 六害 across the four pillars; every hit records its evidence (triggering pillars, human-readable factors) and the classical source (《三命通会》), keeping interpretation separate from calculation.
- **Luck pillars (大运)**: direction from year-stem polarity × gender (阳男/阴女顺行, 阴男/阳女逆行); start age from birth-to-neighboring-Jie days ÷ 3 (三天折合一岁), fractional. Shown in the web UI alongside each pillar's Ten God and NaYin.
- **Annual pillar (流年)**: the flowing year's ganzhi (the BaZi year begins at Lichun).

## Accuracy notes (honest)

- Solar-term instants are computed astronomically and validated against the National Astronomical Observatory of Japan's published almanac: all 24 terms of 2024 land within 8 minutes of the published instants (typical error 1–6 minutes); 2025 Lichun is within 2 minutes. Births within ~10 minutes of a term boundary should still be double-checked.
- True solar time corrects for longitude (1° = 4 min) and the equation of time (full Meeus ch. 28, < 0.01 min error; checked against published anchors Feb 11 −14.2, May 14 +3.7, Jul 26 −6.4, Nov 3 +16.4 min). Correction applies when a birthplace longitude is supplied; without one, clock time is used as-is.

## Roadmap

- [x] Calculation engine scaffold (pillars, ten gods, elements) with verified tests
- [x] Astronomical solar-term calculation
- [x] True solar time: longitude correction + equation of time
- [x] NaYin (纳音) + hidden-stem Ten Gods in chart readings
- [x] Structural rule evaluation (合/冲/害) with evidence factors + classical citations
- [x] Luck pillars (大运), annual pillars (流年)
- [x] Interpretation engine: Day Master strength (得令/得地/得势 scoring in `packages/engine/src/strength.ts`), favorable elements (喜用神/忌神 + 调候 in `packages/engine/src/favorable.ts`), personality mapping (top Ten God temperaments in `packages/engine/src/personality.ts`) — all shown in the web UI
- [x] Next.js web app: chart UI, element-balance visualizations (English UI with hanzi/pinyin labels)
- [x] Bilingual EN/中文 UI toggle: full STR dictionary in `apps/web/app/page.tsx` covers headings, form labels, and all card body text
- [x] Shareable chart links: birth inputs encoded as URL query params (`encodeShareParams`/`decodeShareParams` in `packages/engine/src/share.ts` with validation tests), pre-filled + auto-run on load, "Copy share link" button in the web UI
