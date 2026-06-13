export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type SessionType = 'run' | 'mobility' | 'gym';
export type RunSubtype = 'jog' | 'interval' | 'long';
export type WeekType = 'build' | 'deload';
export type BlockNumber = 1 | 2 | 3;

export interface ProgramMeta {
  name: string;
  durationWeeks: number;
  philosophy: string;
  progressionRule: string;
  deloadRule: string;
}

export interface WeeklyTemplateEntry {
  day: DayKey;
  sessionId: string;
}

export interface Week {
  week: number;
  block: BlockNumber;
  type: WeekType;
  label: string;
  note: string;
}

export interface BlockPrescription {
  sets: number;
  reps: string;
  rir: number | null;
  load?: string;
}

export interface DeloadOverride {
  sets: number;
  loadPct: number;
}

export interface ExerciseUpgrade {
  fromBlock: number;
  name: string;
  note: string;
}

export interface Exercise {
  id: string;
  name: string;
  note: string;
  blocks: Record<string, BlockPrescription>;
  deload: DeloadOverride;
  upgrade?: ExerciseUpgrade;
}

export interface MobilityDrill {
  id: string;
  name: string;
  prescription: string;
  note: string;
}

export interface RunSession {
  type: 'run';
  subtype: RunSubtype;
  title: string;
  intent: string;
}

export interface MobilitySession {
  type: 'mobility';
  title: string;
  location: string;
  equipment: string[];
  durationMinutes: number;
  intent: string;
  drills: MobilityDrill[];
}

export interface GymSession {
  type: 'gym';
  title: string;
  durationMinutes: number;
  warmup: { general: string; specific: string };
  cooldown: string;
  exercises: Exercise[];
}

export type Session = RunSession | MobilitySession | GymSession;

export interface Program {
  program: ProgramMeta;
  weeklyTemplate: WeeklyTemplateEntry[];
  weeks: Week[];
  sessions: Record<string, Session>;
}

export interface ResolvedPrescription {
  sets: number;
  reps: string;
  rir: number | null;
  loadPct: number;
  isDeload: boolean;
  load?: string;
}

export type ProgramPhase = 'before' | 'during' | 'after';

export interface ResolvedSession {
  date: string;
  dayKey: DayKey;
  dayOfProgram: number;
  daysUntilStart: number;
  weekNumber: number;
  weekIndex: number;
  block: BlockNumber;
  weekType: WeekType;
  weekLabel: string;
  weekNote: string;
  isDeload: boolean;
  sessionId: string;
  session: Session;
  prescriptions: Record<string, ResolvedPrescription>;
  isBeyondProgram: boolean;
  phase: ProgramPhase;
}
