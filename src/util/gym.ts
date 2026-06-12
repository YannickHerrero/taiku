import type {
  Exercise,
  GymSession,
  ResolvedSession,
} from '@/data/types';
import type { GymLog, LoggedExercise, LoggedSet } from '@/store/types';

const TIME_BASED_IDS = new Set(['core_a', 'core_b']);

export function isTimeBased(exerciseId: string) {
  return TIME_BASED_IDS.has(exerciseId);
}

const DEFAULT_REST_SECONDS: Record<string, number> = {
  squat: 150,
  rdl: 150,
  horizontal_push: 120,
  horizontal_pull: 120,
  vertical_pull: 120,
  vertical_push: 90,
  single_leg: 90,
  calf_raises: 60,
  core_a: 45,
  core_b: 45,
};

export function restSecondsFor(exerciseId: string) {
  return DEFAULT_REST_SECONDS[exerciseId] ?? 90;
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  squat: 16,
  rdl: 28,
  horizontal_push: 16,
  horizontal_pull: 30,
  vertical_pull: 40,
  vertical_push: 12,
  single_leg: 0,
  calf_raises: 60,
  core_a: 30,
  core_b: 30,
};

export function defaultWeightFor(exerciseId: string) {
  return DEFAULT_WEIGHTS[exerciseId] ?? 10;
}

export function defaultRepsFor(exerciseId: string) {
  if (TIME_BASED_IDS.has(exerciseId)) return 0;
  return 8;
}

export function buildSkeleton(
  today: ResolvedSession,
  previousLog?: GymLog,
): LoggedExercise[] {
  const session = today.session as GymSession;
  return session.exercises.map((ex) => {
    const prev = previousLog?.exercises.find((p) => p.exerciseId === ex.id);
    const prescription = today.prescriptions[ex.id];
    const setCount = prescription.sets;
    const unit: LoggedSet['unit'] = isTimeBased(ex.id) ? 's' : 'kg';
    const sets: LoggedSet[] = Array.from({ length: setCount }, (_, i) => {
      const prevSet = prev?.sets[i];
      const baseWeight = prevSet?.weight ?? defaultWeightFor(ex.id);
      const weight = prescription.isDeload && unit === 'kg'
        ? roundToNearest(baseWeight * (prescription.loadPct / 100), 2.5)
        : baseWeight;
      const reps = prevSet?.reps ?? defaultRepsFor(ex.id);
      return { weight, reps, done: false, unit };
    });
    return {
      exerciseId: ex.id,
      upgraded: prev?.upgraded ?? false,
      sets,
    };
  });
}

export function roundToNearest(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

export function formatPrescription(
  exercise: Exercise,
  today: ResolvedSession,
) {
  const p = today.prescriptions[exercise.id];
  const rir = p.rir == null ? '' : ` @ RIR ${p.rir}`;
  if (p.isDeload) {
    return `${p.sets} × ${p.reps}${rir} · 60% load`;
  }
  return `${p.sets} × ${p.reps}${rir}`;
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
