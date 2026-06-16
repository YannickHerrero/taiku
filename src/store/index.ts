import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ymd } from '@/data/program';

import type {
  CheckIn,
  GymLog,
  LoggedExercise,
  LoggedSet,
  MobilityLog,
  RunLog,
  Settings,
} from './types';

const DEFAULT_START = ymd(new Date('2026-06-15T00:00:00'));

interface State {
  hydrated: boolean;
  settings: Settings;
  checkIns: Record<string, CheckIn>;
  gymLogs: Record<string, GymLog>;
  mobilityLogs: Record<string, MobilityLog>;
  runLogs: Record<string, RunLog>;
  rest: {
    exerciseId?: string;
    endsAt?: number;
    totalSeconds?: number;
  };
}

interface Actions {
  setStartDate: (date: string) => void;
  setTheme: (theme: Settings['theme']) => void;
  setStravaConnected: (connected: boolean) => void;
  saveCheckIn: (entry: Partial<CheckIn> & { date: string }) => void;
  ensureGymLog: (
    date: string,
    sessionId: 'gym_a' | 'gym_b',
    skeleton: LoggedExercise[],
    appliedDeload: boolean,
  ) => void;
  updateSet: (
    date: string,
    exerciseId: string,
    setIndex: number,
    patch: Partial<LoggedSet>,
  ) => void;
  updateWarmupSet: (
    date: string,
    exerciseId: string,
    setIndex: number,
    patch: Partial<LoggedSet>,
  ) => void;
  setExerciseRpe: (date: string, exerciseId: string, rpe: number) => void;
  setExerciseVariant: (
    date: string,
    exerciseId: string,
    variantId: string,
    seed: { workingSets: LoggedSet[]; warmupSets: LoggedSet[] },
  ) => void;
  completeGymSession: (date: string) => void;
  startRest: (exerciseId: string, seconds: number) => void;
  stopRest: () => void;
  toggleMobilityDrill: (date: string, drillId: string) => void;
  completeMobility: (date: string) => void;
  setRunDone: (date: string, sessionId: string, done: boolean) => void;
  resetAll: () => void;
}

export type TaikuStore = State & Actions;

const initialState: State = {
  hydrated: false,
  settings: {
    startDate: DEFAULT_START,
    theme: 'dark',
    stravaConnected: false,
  },
  checkIns: {},
  gymLogs: {},
  mobilityLogs: {},
  runLogs: {},
  rest: {},
};

export const useStore = create<TaikuStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStartDate: (date) =>
        set((s) => ({ settings: { ...s.settings, startDate: date } })),
      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),
      setStravaConnected: (connected) =>
        set((s) => ({ settings: { ...s.settings, stravaConnected: connected } })),

      saveCheckIn: (entry) =>
        set((s) => ({
          checkIns: {
            ...s.checkIns,
            [entry.date]: {
              ...(s.checkIns[entry.date] ?? { date: entry.date }),
              ...entry,
            },
          },
        })),

      ensureGymLog: (date, sessionId, skeleton, appliedDeload) =>
        set((s) => {
          if (s.gymLogs[date]) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: {
                date,
                sessionId,
                exercises: skeleton,
                appliedDeload,
                startedAt: Date.now(),
              },
            },
          };
        }),

      updateSet: (date, exerciseId, setIndex, patch) =>
        set((s) => {
          const log = s.gymLogs[date];
          if (!log) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: {
                ...log,
                exercises: log.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId
                    ? ex
                    : {
                        ...ex,
                        sets: ex.sets.map((set_, i) =>
                          i !== setIndex ? set_ : { ...set_, ...patch },
                        ),
                      },
                ),
              },
            },
          };
        }),

      updateWarmupSet: (date, exerciseId, setIndex, patch) =>
        set((s) => {
          const log = s.gymLogs[date];
          if (!log) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: {
                ...log,
                exercises: log.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId
                    ? ex
                    : {
                        ...ex,
                        warmupSets: ex.warmupSets.map((set_, i) =>
                          i !== setIndex ? set_ : { ...set_, ...patch },
                        ),
                      },
                ),
              },
            },
          };
        }),

      setExerciseRpe: (date, exerciseId, rpe) =>
        set((s) => {
          const log = s.gymLogs[date];
          if (!log) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: {
                ...log,
                exercises: log.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId
                    ? ex
                    : { ...ex, rpe: ex.rpe === rpe ? undefined : rpe },
                ),
              },
            },
          };
        }),

      setExerciseVariant: (date, exerciseId, variantId, seed) =>
        set((s) => {
          const log = s.gymLogs[date];
          if (!log) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: {
                ...log,
                exercises: log.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId
                    ? ex
                    : {
                        ...ex,
                        variantId,
                        sets: ex.sets.map((existing, i) =>
                          existing.done ? existing : seed.workingSets[i] ?? existing,
                        ),
                        warmupSets: ex.warmupSets.map((existing, i) =>
                          existing.done ? existing : seed.warmupSets[i] ?? existing,
                        ),
                      },
                ),
              },
            },
          };
        }),

      completeGymSession: (date) =>
        set((s) => {
          const log = s.gymLogs[date];
          if (!log) return s;
          return {
            gymLogs: {
              ...s.gymLogs,
              [date]: { ...log, completedAt: Date.now() },
            },
            rest: {},
          };
        }),

      startRest: (exerciseId, seconds) =>
        set({
          rest: {
            exerciseId,
            endsAt: Date.now() + seconds * 1000,
            totalSeconds: seconds,
          },
        }),

      stopRest: () => set({ rest: {} }),

      toggleMobilityDrill: (date, drillId) =>
        set((s) => {
          const log = s.mobilityLogs[date] ?? { date, drillsDone: {} };
          return {
            mobilityLogs: {
              ...s.mobilityLogs,
              [date]: {
                ...log,
                drillsDone: {
                  ...log.drillsDone,
                  [drillId]: !log.drillsDone[drillId],
                },
              },
            },
          };
        }),

      completeMobility: (date) =>
        set((s) => {
          const log = s.mobilityLogs[date] ?? { date, drillsDone: {} };
          return {
            mobilityLogs: {
              ...s.mobilityLogs,
              [date]: { ...log, completedAt: Date.now() },
            },
          };
        }),

      setRunDone: (date, sessionId, done) =>
        set((s) => ({
          runLogs: {
            ...s.runLogs,
            [date]: { date, sessionId, done },
          },
        })),

      resetAll: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: 'taiku.store.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        checkIns: state.checkIns,
        gymLogs: state.gymLogs,
        mobilityLogs: state.mobilityLogs,
        runLogs: state.runLogs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function todayKey() {
  return ymd(new Date());
}
