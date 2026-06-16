import type {
  Exercise,
  ExerciseWarmup,
  GymSession,
  ResolvedSession,
} from '@/data/types';
import type { GymLog, LoggedExercise, LoggedSet } from '@/store/types';

// No time-based exercises in the current program; keep the helper around so
// existing call sites compile.
export function isTimeBased(_exerciseId: string) {
  return false;
}

const DEFAULT_REST_SECONDS: Record<string, number> = {
  deadlift: 180,
  squat: 150,
  bench: 120,
  row: 90,
};

export function restSecondsFor(exerciseId: string) {
  return DEFAULT_REST_SECONDS[exerciseId] ?? 120;
}

// Per-variant starting weight (kg) — used when no previous log exists.
const DEFAULT_WEIGHTS: Record<string, number> = {
  // squat
  back_squat: 40,
  front_squat: 30,
  goblet_squat: 16,
  // bench
  barbell_bench: 30,
  db_bench: 12,
  pushups: 0,
  // row
  barbell_row: 30,
  db_row: 12,
  chest_supported_row: 25,
  // deadlift
  conventional_deadlift: 60,
  trap_bar_deadlift: 60,
  romanian_deadlift: 40,
};

export function defaultWeightFor(variantId: string) {
  return DEFAULT_WEIGHTS[variantId] ?? 20;
}

export function defaultVariantId(exercise: Exercise): string {
  return (
    exercise.variants.find((v) => v.default)?.id ?? exercise.variants[0]?.id
  );
}

export function variantNameOf(exercise: Exercise, variantId: string): string {
  return (
    exercise.variants.find((v) => v.id === variantId)?.name ?? exercise.name
  );
}

export function defaultRepsForBlock(reps: string): number {
  const n = parseInt(reps, 10);
  return Number.isFinite(n) && n > 0 ? n : 8;
}

export function roundToNearest(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

export function computeWarmupSets(
  workingWeight: number,
  warmup: ExerciseWarmup,
): LoggedSet[] {
  return Array.from({ length: warmup.sets }, (_, i) => {
    const pct = warmup.pcts[i] ?? warmup.pcts[warmup.pcts.length - 1] ?? 50;
    const w =
      workingWeight > 0
        ? roundToNearest((workingWeight * pct) / 100, 2.5)
        : 0;
    return { weight: w, reps: warmup.reps, done: false, unit: 'kg' };
  });
}

export function findPreviousVariantLog(
  gymLogs: Record<string, GymLog>,
  forDate: string,
  sessionId: 'gym_a' | 'gym_b',
  exerciseId: string,
  variantId: string,
): GymLog | undefined {
  const candidates = Object.values(gymLogs)
    .filter((l) => l.sessionId === sessionId && l.date < forDate)
    .filter((l) =>
      l.exercises.some(
        (e) => e.exerciseId === exerciseId && e.variantId === variantId,
      ),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return candidates[0];
}

// Most recent variant used for an exercise (any session, any date).
function lastUsedVariantId(
  gymLogs: Record<string, GymLog>,
  exerciseId: string,
): string | undefined {
  const logs = Object.values(gymLogs)
    .filter((l) =>
      l.exercises.some((e) => e.exerciseId === exerciseId && e.variantId),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return logs[0]?.exercises.find((e) => e.exerciseId === exerciseId)?.variantId;
}

export function buildSkeleton(
  today: ResolvedSession,
  gymLogs: Record<string, GymLog>,
): LoggedExercise[] {
  const session = today.session as GymSession;
  return session.exercises.map((ex) => {
    const variantId = lastUsedVariantId(gymLogs, ex.id) ?? defaultVariantId(ex);
    const prev = findPreviousVariantLog(
      gymLogs,
      today.date,
      today.sessionId as 'gym_a' | 'gym_b',
      ex.id,
      variantId,
    );
    const prevExercise = prev?.exercises.find((p) => p.exerciseId === ex.id);
    const prescription = today.prescriptions[ex.id];
    const setCount = prescription.sets;
    const baseWeight =
      prevExercise?.sets[0]?.weight ?? defaultWeightFor(variantId);
    const workingWeight = prescription.isDeload
      ? roundToNearest((baseWeight * prescription.loadPct) / 100, 2.5)
      : baseWeight;
    const reps = prevExercise?.sets[0]?.reps ?? defaultRepsForBlock(prescription.reps);

    const sets: LoggedSet[] = Array.from({ length: setCount }, (_, i) => {
      const prevSet = prevExercise?.sets[i];
      return {
        weight: prescription.isDeload ? workingWeight : prevSet?.weight ?? workingWeight,
        reps: prevSet?.reps ?? reps,
        done: false,
        unit: 'kg',
      };
    });
    const warmupSets = prescription.isDeload
      ? []
      : computeWarmupSets(sets[0]?.weight ?? workingWeight, ex.warmup);

    return {
      exerciseId: ex.id,
      variantId,
      sets,
      warmupSets,
    };
  });
}

export function buildVariantSeed(
  exercise: Exercise,
  prescription: ResolvedSession['prescriptions'][string],
  prev: GymLog | undefined,
): { workingSets: LoggedSet[]; warmupSets: LoggedSet[] } {
  const prevExercise = prev?.exercises.find((p) => p.exerciseId === exercise.id);
  const baseWeight =
    prevExercise?.sets[0]?.weight ?? defaultWeightFor(prevExerciseVariantOr(prevExercise, exercise));
  const workingWeight = prescription.isDeload
    ? roundToNearest((baseWeight * prescription.loadPct) / 100, 2.5)
    : baseWeight;
  const reps = prevExercise?.sets[0]?.reps ?? defaultRepsForBlock(prescription.reps);
  const workingSets: LoggedSet[] = Array.from(
    { length: prescription.sets },
    (_, i) => {
      const prevSet = prevExercise?.sets[i];
      return {
        weight: prescription.isDeload ? workingWeight : prevSet?.weight ?? workingWeight,
        reps: prevSet?.reps ?? reps,
        done: false,
        unit: 'kg',
      };
    },
  );
  const warmupSets = prescription.isDeload
    ? []
    : computeWarmupSets(workingSets[0]?.weight ?? workingWeight, exercise.warmup);
  return { workingSets, warmupSets };
}

function prevExerciseVariantOr(
  prevExercise: LoggedExercise | undefined,
  exercise: Exercise,
) {
  return prevExercise?.variantId ?? defaultVariantId(exercise);
}

export function formatPrescriptionShort(
  exercise: Exercise,
  today: ResolvedSession,
) {
  const p = today.prescriptions[exercise.id];
  if (p.isDeload) return `${p.sets} sets @ ${p.loadPct}%`;
  const rir = p.rir == null ? '' : ` · RIR ${p.rir}`;
  return `${p.sets} × ${p.reps}${rir}`;
}
