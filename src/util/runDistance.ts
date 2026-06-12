import type { Session } from '@/data/types';

const PLANNED_KM: Record<string, number> = {
  run_jog: 7,
  run_interval: 8,
  run_long: 18,
};

export function plannedKmFor(session: Session, sessionId: string): number {
  if (session.type !== 'run') return 0;
  return PLANNED_KM[sessionId] ?? 8;
}
