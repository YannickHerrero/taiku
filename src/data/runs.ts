/**
 * Runs are tracked on Garmin; the app only knows about completion (manually
 * marked done) plus an optional distance/duration the user can attach.
 *
 * This module is the seam for a future Strava/Garmin importer:
 *   importRuns: (range) => Promise<ImportedRun[]>
 * Each ImportedRun maps onto a ymd day and updates the run-day log.
 */

export interface RunLogEntry {
  date: string;
  sessionId: string;
  done: boolean;
  distanceKm?: number;
  durationMinutes?: number;
  source: 'manual' | 'strava' | 'garmin';
}

export interface RunImporter {
  importSince(date: string): Promise<RunLogEntry[]>;
}

export const NULL_IMPORTER: RunImporter = {
  async importSince() {
    return [];
  },
};
