import { addDays, dateFromYmd, resolveSessionForDate, ymd } from '@/data/program';
import type { CheckIn, GymLog, MobilityLog, RunLog } from '@/store/types';
import type { Session } from '@/data/types';

export function mondayOf(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  block: number;
  weekLabel: string;
  weekType: 'build' | 'deload';
  insight: string;
  weights: number[];
  sleeps: number[];
  legs: number[];
  avgWeight?: number;
  avgSleep?: number;
  avgLegs?: number;
  plannedSessions: number;
  doneSessions: number;
  adherencePct: number;
  lifts: Array<{
    exerciseId: string;
    name: string;
    sets: Array<{ weight: number; reps: number; date: string }>;
    latest?: { weight: number; reps: number };
    deltaFromFirst?: number;
  }>;
}

interface BuildParams {
  startDate: Date;
  targetDate: Date;
  checkIns: Record<string, CheckIn>;
  gymLogs: Record<string, GymLog>;
  mobilityLogs: Record<string, MobilityLog>;
  runLogs: Record<string, RunLog>;
}

export function buildWeeklySummary({
  startDate,
  targetDate,
  checkIns,
  gymLogs,
  mobilityLogs,
  runLogs,
}: BuildParams): WeeklySummary {
  const start = mondayOf(targetDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const dayKeys = days.map(ymd);

  const weights = dayKeys
    .map((k) => checkIns[k]?.weightKg)
    .filter((n): n is number => typeof n === 'number');
  const sleeps = dayKeys
    .map((k) => checkIns[k]?.sleepScore)
    .filter((n): n is number => typeof n === 'number');
  const legs: number[] = dayKeys
    .map((k) => checkIns[k]?.legsFeel as number | undefined)
    .filter((n): n is number => typeof n === 'number');

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;

  let planned = 0;
  let done = 0;

  const resolvedToday = resolveSessionForDate(startDate, days[0]);

  for (const d of days) {
    const r = resolveSessionForDate(startDate, d);
    if (r.isBeyondProgram) continue;
    planned += 1;
    if (isDone(r.sessionId, r.session, ymd(d), { gymLogs, mobilityLogs, runLogs })) {
      done += 1;
    }
  }

  const liftMap = new Map<
    string,
    { name: string; sets: Array<{ weight: number; reps: number; date: string }> }
  >();
  const lifetimeGym = Object.values(gymLogs)
    .filter((l) => l.completedAt)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const log of lifetimeGym) {
    for (const ex of log.exercises) {
      const entry = liftMap.get(ex.exerciseId) ?? { name: ex.exerciseId, sets: [] };
      ex.sets.forEach((s) => {
        if (s.done && s.unit === 'kg' && s.weight > 0) {
          entry.sets.push({ weight: s.weight, reps: s.reps, date: log.date });
        }
      });
      liftMap.set(ex.exerciseId, entry);
    }
  }

  const lifts = Array.from(liftMap.entries()).map(([id, e]) => {
    const sorted = e.sets.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const last5 = sorted.slice(-5);
    const latest = last5[last5.length - 1];
    const first = sorted[0];
    return {
      exerciseId: id,
      name: prettyExerciseName(id),
      sets: last5,
      latest: latest ? { weight: latest.weight, reps: latest.reps } : undefined,
      deltaFromFirst:
        latest && first ? Math.round((latest.weight - first.weight) * 10) / 10 : undefined,
    };
  });

  return {
    weekStart: ymd(start),
    weekEnd: ymd(days[6]),
    weekNumber: resolvedToday.weekNumber,
    block: resolvedToday.block,
    weekLabel: resolvedToday.weekLabel,
    weekType: resolvedToday.weekType,
    insight: insightLine(legs, sleeps),
    weights,
    sleeps,
    legs,
    avgWeight: avg(weights),
    avgSleep: avg(sleeps),
    avgLegs: avg(legs),
    plannedSessions: planned,
    doneSessions: done,
    adherencePct: planned === 0 ? 0 : (done / planned) * 100,
    lifts,
  };
}

function isDone(
  sessionId: string,
  session: Session,
  date: string,
  logs: {
    gymLogs: Record<string, GymLog>;
    mobilityLogs: Record<string, MobilityLog>;
    runLogs: Record<string, RunLog>;
  },
) {
  if (session.type === 'gym') return !!logs.gymLogs[date]?.completedAt;
  if (session.type === 'mobility') return !!logs.mobilityLogs[date]?.completedAt;
  return !!logs.runLogs[date]?.done;
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
  core_a: 'Dead bug',
  core_b: 'Side plank',
};

function prettyExerciseName(id: string) {
  return PRETTY[id] ?? id;
}

function insightLine(legs: number[], sleeps: number[]): string {
  if (legs.length === 0 && sleeps.length === 0) {
    return 'Log a check-in this week to see how the body is responding.';
  }
  const avgLegs = legs.length ? legs.reduce((a, b) => a + b, 0) / legs.length : 0;
  const avgSleep = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : 0;
  if (avgLegs && avgLegs < 2.5) return 'Legs felt heavy this week. Easy days, easy.';
  if (avgSleep && avgSleep < 60) return 'Sleep score dropped — protect the next deload.';
  if (avgLegs && avgLegs >= 4) return 'Springy week. The work is landing.';
  return 'Quiet week. Stay consistent.';
}
