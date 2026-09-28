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
│       │   ├── solarTerms.ts  # Astronomical solar-term instants (sun's ecliptic longitude)
│       │   ├── pillars.ts     # Year/month/day/hour pillar calculation
│       │   ├── luckPillars.ts # Luck pillars (大运) + annual pillars (流年)
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

## Run the web app

```bash
cd apps/web
npm install
npm run dev    # → http://localhost:3000
```

## Calculation highlights

- **Year pillar** changes at the astronomical instant of Lichun (立春 ≈ Feb 4), not Jan 1 or Lunar New Year — the classic beginner trap, handled to the minute.
- **Month pillar** follows the 12 Jie (节) solar terms via the Five Tigers rule (五虎遁), not lunar months.
- **Solar terms** are computed astronomically: the sun's apparent ecliptic longitude (Meeus-style low-precision coordinates + aberration/nutation) solved for each 15° crossing with Newton iteration.
- **Day pillar** is a continuous 60-day cycle anchored to a verified reference: 2024-01-01 = 甲子日 (cross-checked against published perpetual calendars).
- **Hour pillar** uses the Five Rats rule (五鼠遁), with true-solar-time correction from birthplace longitude, and the late-子时 rule (23:00–24:00 belongs to the next day).
- **Luck pillars (大运)**: direction from year-stem polarity × gender (阳男/阴女顺行, 阴男/阳女逆行); start age from birth-to-neighboring-Jie days ÷ 3 (三天折合一岁), fractional.
- **Annual pillar (流年)**: the flowing year's ganzhi (the BaZi year begins at Lichun).

## Accuracy notes (honest)

- Solar-term instants are computed astronomically and validated against the National Astronomical Observatory of Japan's published almanac: all 24 terms of 2024 land within 8 minutes of the published instants (typical error 1–6 minutes); 2025 Lichun is within 2 minutes. Births within ~10 minutes of a term boundary should still be double-checked.
- True solar time corrects for longitude; the equation of time (±16 min seasonal swing) is not yet applied, so day/hour pillars near an hour boundary carry that uncertainty.

## Roadmap

- [x] Calculation engine scaffold (pillars, ten gods, elements) with verified tests
- [x] Astronomical solar-term calculation
- [x] Luck pillars (大运), annual pillars (流年)
- [ ] Interpretation engine: Day Master strength, favorable elements, personality mapping
- [x] Next.js web app: chart UI, element-balance visualizations, bilingual EN/中文
- [ ] Saved charts & share links

(Bilingual UI and saved charts are still open — the web app currently ships in English with hanzi/pinyin labels.)
