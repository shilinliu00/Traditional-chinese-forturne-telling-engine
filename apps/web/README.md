# Web app · @bazi/web

Next.js (App Router) + TypeScript frontend for the BaZi calculator. It imports
`@bazi/engine` and stays purely presentational — all calendrical and
astronomical logic lives in `packages/engine`.

## Run it

```bash
npm install   # from this directory (or the repo root — npm workspaces)
npm run dev   # → http://localhost:3000
npm run build # production build
```

## Features

- Birth input form: date, clock time, clock-timezone UTC offset, birthplace
  longitude (for true-solar-time correction), and gender (needed for luck-pillar
  direction).
- Chart display: the four pillars with hanzi, pinyin, Ten Gods (十神) vs. the
  Day Master, and hidden stems (藏干) with their Ten Gods; the Day Master
  pillar is highlighted.
- Five-element (五行) balance across stems + branches.
- Luck pillars (大运) timeline with fractional start ages; the current pillar
  is highlighted based on the native's age.
- Current annual pillar (流年), computed from the BaZi year of today.
