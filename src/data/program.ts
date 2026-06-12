import type {
  BlockPrescription,
  DayKey,
  Exercise,
  GymSession,
  Program,
  ResolvedPrescription,
  ResolvedSession,
} from './types';

import programJson from '../../program.json';

export const PROGRAM: Program = programJson as Program;

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function dayKeyFromDate(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateFromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dayOfProgram(startDate: Date, date: Date): number {
  return daysBetween(startDate, date) + 1;
}

export function weekNumberForDay(day: number): number {
  return Math.max(1, Math.ceil(day / 7));
}

export function sessionIdForDay(day: DayKey): string {
  const entry = PROGRAM.weeklyTemplate.find((e) => e.day === day);
  if (!entry) throw new Error(`No template entry for ${day}`);
  return entry.sessionId;
}

export function getWeek(weekNumber: number) {
  return PROGRAM.weeks[Math.min(weekNumber, PROGRAM.weeks.length) - 1];
}

export function getSession(sessionId: string) {
  const s = PROGRAM.sessions[sessionId];
  if (!s) throw new Error(`Unknown sessionId: ${sessionId}`);
  return s;
}

function resolveExercisePrescription(
  exercise: Exercise,
  block: number,
  isDeload: boolean,
): ResolvedPrescription {
  const blockKey = String(block);
  const base: BlockPrescription =
    exercise.blocks[blockKey] ?? exercise.blocks['1'];
  if (isDeload) {
    return {
      sets: exercise.deload.sets,
      reps: base.reps,
      rir: base.rir,
      loadPct: exercise.deload.loadPct,
      isDeload: true,
      load: base.load,
    };
  }
  return {
    sets: base.sets,
    reps: base.reps,
    rir: base.rir,
    loadPct: 100,
    isDeload: false,
    load: base.load,
  };
}

export function resolveSessionForDate(
  startDate: Date,
  date: Date,
): ResolvedSession {
  const d = startOfDay(date);
  const start = startOfDay(startDate);
  const day = dayOfProgram(start, d);
  const totalDays = PROGRAM.weeks.length * 7;
  const isBeyondProgram = day < 1 || day > totalDays;
  const clampedDay = Math.max(1, Math.min(day, totalDays));
  const weekNumber = weekNumberForDay(clampedDay);
  const weekIndex = weekNumber - 1;
  const week = getWeek(weekNumber);
  const dayKey = dayKeyFromDate(d);
  const sessionId = sessionIdForDay(dayKey);
  const session = getSession(sessionId);
  const isDeload = week.type === 'deload';

  const prescriptions: Record<string, ResolvedPrescription> = {};
  if (session.type === 'gym') {
    for (const ex of (session as GymSession).exercises) {
      prescriptions[ex.id] = resolveExercisePrescription(ex, week.block, isDeload);
    }
  }

  return {
    date: ymd(d),
    dayKey,
    dayOfProgram: day,
    weekNumber,
    weekIndex,
    block: week.block,
    weekType: week.type,
    weekLabel: week.label,
    weekNote: week.note,
    isDeload,
    sessionId,
    session,
    prescriptions,
    isBeyondProgram,
  };
}

export function totalProgramDays(): number {
  return PROGRAM.weeks.length * 7;
}
