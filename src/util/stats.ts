import {
  PROGRAM,
  addDays,
  dateFromYmd,
  resolveSessionForDate,
} from '@/data/program';
import type { CheckIn, GymLog, MobilityLog, RunLog } from '@/store/types';
import { plannedKmFor } from '@/util/runDistance';

export interface AllTimeStats {
  totalRunKm: number;
  totalRuns: number;
  longestKm: number;
  avgKm: number;
  totalTonnage: number;
  totalGymSessions: number;
  totalSets: number;
  liftProgress: Array<{
    exerciseId: string;
    name: string;
    first?: number;
    latest?: number;
    delta?: number;
  }>;
  weightStart?: number;
  weightLatest?: number;
  weightDelta?: number;
  weightSeries: Array<{ date: string; kg: number }>;
  avgSleep?: number;
  avgLegs?: number;
  consistencyPct: number;
  totalPlanned: number;
  totalDone: number;
}

const PRETTY: Record<string, string> = {
  squat: 'Goblet squat',
  rdl: 'KB Romanian DL',
  horizontal_push: 'DB bench press',
  horizontal_pull: 'Seated row',
  vertical_pull: 'Lat pulldown',
  vertical_push: 'OHP',
  single_leg: 'BG split squat',
  calf_raises: 'Calf raises',
};

interface BuildParams {
  startDate: string;
  todayDate: Date;
  checkIns: Record<string, CheckIn>;
  gymLogs: Record<string, GymLog>;
  mobilityLogs: Record<string, MobilityLog>;
  runLogs: Record<string, RunLog>;
}

export function buildAllTimeStats({
  startDate,
  todayDate,
  checkIns,
  gymLogs,
  mobilityLogs,
  runLogs,
}: BuildParams): AllTimeStats {
  const start = dateFromYmd(startDate);
  const today = todayDate;

  const runs = Object.values(runLogs).filter((r) => r.done);
  const runKms = runs.map((r) => {
    if (r.distanceKm) return r.distanceKm;
    const resolved = resolveSessionForDate(start, dateFromYmd(r.date));
    return plannedKmFor(resolved.session, resolved.sessionId);
  });
  const totalRunKm = runKms.reduce((a, b) => a + b, 0);
  const longestKm = runKms.length ? Math.max(...runKms) : 0;
  const avgKm = runs.length ? totalRunKm / runs.length : 0;

  const gymSessions = Object.values(gymLogs).filter((g) => g.completedAt);
  const totalGymSessions = gymSessions.length;
  let totalSets = 0;
  let totalTonnage = 0;
  for (const log of gymSessions) {
    for (const ex of log.exercises) {
      for (const s of ex.sets) {
        if (!s.done) continue;
        totalSets += 1;
        if (s.unit === 'kg') {
          totalTonnage += s.weight * s.reps;
        }
      }
    }
  }

  const liftMap = new Map<string, Array<{ date: string; weight: number }>>();
  for (const log of gymSessions) {
    for (const ex of log.exercises) {
      const arr = liftMap.get(ex.exerciseId) ?? [];
      for (const s of ex.sets) {
        if (s.done && s.unit === 'kg') {
          arr.push({ date: log.date, weight: s.weight });
        }
      }
      liftMap.set(ex.exerciseId, arr);
    }
  }
  const liftProgress = Array.from(liftMap.entries())
    .map(([id, arr]) => {
      if (arr.length === 0) {
        return { exerciseId: id, name: PRETTY[id] ?? id };
      }
      const sorted = arr.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
      const first = sorted[0].weight;
      const latest = sorted[sorted.length - 1].weight;
      return {
        exerciseId: id,
        name: PRETTY[id] ?? id,
        first,
        latest,
        delta: Math.round((latest - first) * 10) / 10,
      };
    })
    .filter((l) => l.first != null);

  const checkInList = Object.values(checkIns).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
  const weights = checkInList.filter((c) => c.weightKg != null);
  const weightSeries = weights.map((c) => ({
    date: c.date,
    kg: c.weightKg as number,
  }));
  const weightStart = weightSeries[0]?.kg;
  const weightLatest = weightSeries[weightSeries.length - 1]?.kg;
  const weightDelta =
    weightStart != null && weightLatest != null
      ? Math.round((weightLatest - weightStart) * 10) / 10
      : undefined;

  const sleeps = checkInList
    .map((c) => c.sleepScore)
    .filter((n): n is number => typeof n === 'number');
  const legs = checkInList
    .map((c) => c.legsFeel as number | undefined)
    .filter((n): n is number => typeof n === 'number');
  const avgSleep = sleeps.length
    ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length
    : undefined;
  const avgLegs = legs.length
    ? legs.reduce((a, b) => a + b, 0) / legs.length
    : undefined;

  const totalPlanned = (() => {
    let n = 0;
    let cursor = start;
    while (cursor.getTime() <= today.getTime() && cursor.getTime() < addDays(start, PROGRAM.weeks.length * 7).getTime()) {
      n += 1;
      cursor = addDays(cursor, 1);
    }
    return n;
  })();

  let totalDone = 0;
  for (const r of Object.values(runLogs)) if (r.done) totalDone += 1;
  for (const g of Object.values(gymLogs)) if (g.completedAt) totalDone += 1;
  for (const m of Object.values(mobilityLogs)) if (m.completedAt) totalDone += 1;

  const consistencyPct =
    totalPlanned === 0 ? 0 : Math.min(100, (totalDone / totalPlanned) * 100);

  return {
    totalRunKm,
    totalRuns: runs.length,
    longestKm,
    avgKm,
    totalTonnage,
    totalGymSessions,
    totalSets,
    liftProgress,
    weightStart,
    weightLatest,
    weightDelta,
    weightSeries,
    avgSleep,
    avgLegs,
    consistencyPct,
    totalPlanned,
    totalDone,
  };
}

