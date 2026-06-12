# Taiku

A personal iOS training companion for a 90-day program. Single user, all data
local on device, no auth, no backend. Built with Expo (SDK 54) and runs in
Expo Go on iOS.

## Run it

```sh
npm install
npm start
```

Then open the project in Expo Go on your iPhone. The SDK is pinned to **54**
to match the version of Expo Go currently on the App Store.

## Tech choices

Each choice picked for **boring + works in Expo Go**:

| Concern        | Choice                              | Why                                                                       |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Navigation     | `expo-router`                       | File-based, ships with Expo Go, good DX, handles tabs + stack out of box. |
| State          | `zustand`                           | Tiny (3 kB), no boilerplate, just a hook.                                 |
| Persistence    | `@react-native-async-storage/...`   | Standard RN key/value store; zustand's `persist` middleware plugs in.     |
| Charts         | `react-native-svg`                  | All sparklines/ring are hand-rolled SVG — no chart lib needed.            |
| Typography     | `@expo-google-fonts/...`            | Hanken Grotesk + IBM Plex Mono, loaded at boot, splash held until ready.  |
| Slider         | `@react-native-community/slider`    | Native iOS slider for the sleep score input.                              |
| Date picker    | `@react-native-community/datetimepicker` | For the start-date setting only.                                       |
| Stay awake    | `expo-keep-awake`                   | Holds the screen on while the gym tracker is mounted.                     |

No custom native modules, no config plugins requiring a dev build. Tested by
running `npx expo export --platform ios` cleanly.

## Data model

`program.json` at the repo root is the **single source of truth** for the
training plan. The app bundles it directly (see
`src/data/program.ts`). It exposes:

- `program` — name, philosophy, progression and deload rules.
- `weeklyTemplate` — `day → sessionId` for each of the 7 weekdays.
- `weeks[]` — 13 entries, each `{ week, block, type, label, note }` where
  `type` is `"build"` or `"deload"`.
- `sessions{}` — keyed by `sessionId`:
  - **runs** (`run_jog`, `run_interval`, `run_long`): `title` + `intent`. Runs
    are tracked on Garmin; the app only stores a manual "done" flag.
  - **mobility**: drills array (`name`, `prescription`, `note`).
  - **gym_a** / **gym_b**: warmup, cooldown, exercises with per-block
    prescriptions (`blocks["1"..."3"]` = `{ sets, reps, rir }`) and a
    `deload` override (`{ sets, loadPct }`).

### Resolving "today's session"

`resolveSessionForDate(startDate, date)` does the lookup:

```
day-of-program = days between startDate and date + 1
weekNumber     = ceil(day / 7)                          → PROGRAM.weeks[weekNumber-1]
sessionId      = weeklyTemplate[date.weekday]           → PROGRAM.sessions[sessionId]
prescription   = exercise.blocks[week.block]            (build week)
               | { sets: deload.sets, loadPct: 60 }     (deload week, type==="deload")
```

That returns a fully `ResolvedSession` with the right prescription per
exercise — gym mode renders directly off it.

### User-logged data (in AsyncStorage)

Stored in zustand under key `taiku.store.v1`:

- `settings` — `startDate`, `theme`, `stravaConnected`.
- `checkIns[date]` — `weightKg`, `sleepScore`, `legsFeel`.
- `gymLogs[date]` — sessionId, per-exercise `{ upgraded, sets[], rpe? }`,
  `appliedDeload`, `startedAt`, `completedAt`.
- `mobilityLogs[date]` — per-drill done map + `completedAt`.
- `runLogs[date]` — `{ done }` (manual mark; logged on Garmin).

The rest timer is ephemeral and lives in the same store.

## Project layout

```
app/                expo-router routes
  (tabs)/           4-tab bottom bar: Today, Week, Plan, Settings
  gym.tsx           gym-mode tracker (push from Today)
  mobility.tsx      mobility checklist (push from Today)
  stats.tsx         since-day-1 stats (push from Plan)
src/
  components/       Card, Text, Pill, Segmented, Sparkline, Ring, RestTimer, …
  data/             program.json loader, types, run-import seam
  store/            zustand store + persistence
  theme/            dark/light token sets, ThemeProvider
  util/             gym, weekly, stats, formatting helpers
program.json        single source of truth (also bundled by Metro)
```

## Strava / Garmin

Not integrated yet. The seam lives in `src/data/runs.ts` — implement
`RunImporter` and call it from settings. Settings already has a placeholder
Strava toggle to mark intent.

## Resetting

Settings → "Reset all data" wipes AsyncStorage and reverts to defaults.

## Style

Tokens are inlined from the design file (`Taiku.dc.html`). Dark is default;
light values come from the same source and reuse the same component shapes —
no separate stylesheets.
