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

## Share links

The "Copy share link" button encodes the form inputs as query params so a
chart can be bookmarked or sent as a link; the form pre-fills and runs
automatically when the link opens.

- `date` — birth date, `YYYY-MM-DD` (validated as a real calendar date)
- `time` — clock time, `HH:mm`
- `tz` — clock-timezone UTC offset in hours, halves allowed (`-12`..`14`)
- `lon` — birthplace longitude °E, `-180`..`180` (omit for clock time)
- `gender` — `male` or `female` (luck-pillar direction)
- `lang` — `en` or `zh`

A link with any missing or malformed value is ignored and the form keeps its
defaults. Encode/decode logic lives in `packages/engine/src/share.ts` with
validation tests.
