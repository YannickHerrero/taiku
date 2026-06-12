export interface CheckIn {
  date: string;
  weightKg?: number;
  sleepScore?: number;
  legsFeel?: 1 | 2 | 3 | 4 | 5;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  done: boolean;
  unit: 'kg' | 's';
}

export interface LoggedExercise {
  exerciseId: string;
  upgraded: boolean;
  sets: LoggedSet[];
  rpe?: number;
}

export interface GymLog {
  date: string;
  sessionId: 'gym_a' | 'gym_b';
  exercises: LoggedExercise[];
  appliedDeload: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface MobilityLog {
  date: string;
  drillsDone: Record<string, boolean>;
  completedAt?: number;
}

export interface RunLog {
  date: string;
  sessionId: string;
  done: boolean;
  distanceKm?: number;
  durationMinutes?: number;
}

export type Theme = 'dark' | 'light' | 'system';

export interface Settings {
  startDate: string;
  theme: Theme;
  stravaConnected: boolean;
}
