import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { RestTimer } from '@/components/RestTimer';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { dateFromYmd, resolveSessionForDate } from '@/data/program';
import type { GymSession } from '@/data/types';
import { useStore } from '@/store';
import type { GymLog, LoggedExercise } from '@/store/types';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import {
  buildSkeleton,
  defaultWeightFor,
  formatPrescriptionShort,
  isTimeBased,
  restSecondsFor,
} from '@/util/gym';

export default function GymScreen() {
  useKeepAwake();
  const t = useTokens();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const startDate = useStore((s) => s.settings.startDate);
  const today = useMemo(
    () => resolveSessionForDate(dateFromYmd(startDate), new Date()),
    [startDate],
  );
  const session = today.session as GymSession;

  const log = useStore((s) => s.gymLogs[today.date]);
  const ensureGymLog = useStore((s) => s.ensureGymLog);
  const completeGymSession = useStore((s) => s.completeGymSession);
  const previousGymLog = useStore((s) =>
    findPreviousLog(s.gymLogs, today.date, today.sessionId as 'gym_a' | 'gym_b'),
  );

  useEffect(() => {
    if (!log && session.type === 'gym' && today.session.type === 'gym' && !preview) {
      const skeleton = buildSkeleton(today, previousGymLog ?? undefined);
      ensureGymLog(
        today.date,
        today.sessionId as 'gym_a' | 'gym_b',
        skeleton,
        today.isDeload,
      );
    }
  }, [log, today, ensureGymLog, previousGymLog, session.type, preview]);

  const exercises = log?.exercises ?? buildSkeleton(today, previousGymLog ?? undefined);
  const [warmupOpen, setWarmupOpen] = useState(false);

  if (session.type !== 'gym') {
    return (
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text tone="low" variant="small">
            ← Today
          </Text>
        </Pressable>
        <Text variant="h2" style={{ marginTop: 14 }}>
          No gym session today.
        </Text>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}
        >
          <Text variant="small" tone="low">
            ← Today
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <Text variant="h2" style={{ flex: 1 }}>
            {session.title}
          </Text>
          <Text variant="mono" tone="low">
            WK {today.weekNumber}
          </Text>
        </View>
        <Text
          variant="small"
          tone={today.isDeload ? 'sage' : 'low'}
          style={{ marginBottom: 16 }}
        >
          {today.isDeload
            ? 'Deload volume applied — 2 sets per exercise at 60%'
            : `${session.exercises.length} exercises · ${session.durationMinutes} min · tap a value to adjust`}
        </Text>

        <Card style={{ marginBottom: 12, paddingVertical: 0, paddingHorizontal: 0 }}>
          <Pressable
            onPress={() => setWarmupOpen((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 11, letterSpacing: 2, color: t.low, fontFamily: fonts.bodySemi }}>
              WARM-UP
            </Text>
            <Text variant="small" tone="mid" style={{ flex: 1 }}>
              Run to gym · ramp sets
            </Text>
            <Text variant="small" tone="low">
              {warmupOpen ? '▾' : '▸'}
            </Text>
          </Pressable>
          {warmupOpen && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <WarmupRow label="GENERAL" value={session.warmup.general} />
              <WarmupRow label="SPECIFIC" value={session.warmup.specific} />
              <WarmupRow label="COOLDOWN" value={session.cooldown} />
            </View>
          )}
        </Card>

        {session.exercises.map((exercise, idx) => {
          const logEx =
            exercises.find((e) => e.exerciseId === exercise.id) ?? exercises[idx];
          const prev = previousGymLog?.exercises.find((e) => e.exerciseId === exercise.id);
          return (
            <ExerciseCard
              key={exercise.id}
              exerciseId={exercise.id}
              name={exercise.name}
              note={exercise.note}
              upgrade={exercise.upgrade}
              prescriptionLabel={formatPrescriptionShort(exercise, today)}
              upgraded={logEx.upgraded}
              date={today.date}
              setRows={logEx.sets}
              previousSets={prev?.sets ?? []}
              currentBlock={today.block}
            />
          );
        })}

        {!preview && (
          <Pressable
            onPress={() => {
              completeGymSession(today.date);
              router.back();
            }}
            style={{
              marginTop: 14,
              height: 52,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.sage,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodySemi,
                color: t.onAccent,
                fontSize: 15,
              }}
            >
              Finish session
            </Text>
          </Pressable>
        )}
      </Screen>
      <RestTimer />
    </View>
  );
}

function WarmupRow({ label, value }: { label: string; value: string }) {
  const t = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 9,
        borderTopWidth: 1,
        borderTopColor: t.line,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1.5,
          color: t.low,
          width: 70,
          paddingTop: 2,
          fontFamily: fonts.bodySemi,
        }}
      >
        {label}
      </Text>
      <Text variant="small" tone="intent" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

interface ExerciseCardProps {
  exerciseId: string;
  name: string;
  note: string;
  upgrade?: { fromBlock: number; name: string; note: string };
  prescriptionLabel: string;
  upgraded: boolean;
  date: string;
  setRows: LoggedExercise['sets'];
  previousSets: LoggedExercise['sets'];
  currentBlock: number;
}

function ExerciseCard({
  exerciseId,
  name,
  note,
  upgrade,
  prescriptionLabel,
  upgraded,
  date,
  setRows,
  previousSets,
  currentBlock,
}: ExerciseCardProps) {
  const t = useTokens();
  const time = isTimeBased(exerciseId);
  const updateSet = useStore((s) => s.updateSet);
  const setRpe = useStore((s) => s.setExerciseRpe);
  const toggleUpgrade = useStore((s) => s.toggleExerciseUpgrade);
  const startRest = useStore((s) => s.startRest);
  const log = useStore((s) => s.gymLogs[date]);
  const rpe = log?.exercises.find((e) => e.exerciseId === exerciseId)?.rpe ?? 0;
  const [selectedSet, setSelectedSet] = useState<number | null>(null);

  const upgradeUnlocked = !!upgrade && currentBlock >= upgrade.fromBlock;
  const displayName = upgraded && upgrade ? upgrade.name : name;

  const onCheck = (idx: number) => {
    const set = setRows[idx];
    const next = !set.done;
    updateSet(date, exerciseId, idx, { done: next });
    if (next) {
      startRest(exerciseId, restSecondsFor(exerciseId));
    }
  };

  const adjust = (dw: number, dr: number) => {
    if (selectedSet == null) return;
    const set = setRows[selectedSet];
    updateSet(date, exerciseId, selectedSet, {
      weight: Math.max(0, Math.round((set.weight + dw) * 10) / 10),
      reps: Math.max(1, set.reps + dr),
    });
  };

  return (
    <Card style={{ marginBottom: 12, paddingTop: 14, paddingBottom: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 3,
        }}
      >
        <Text variant="h3" style={{ flex: 1, fontSize: 16 }}>
          {displayName}
        </Text>
        <Text variant="mono" tone="low" style={{ flexShrink: 0 }}>
          {prescriptionLabel}
        </Text>
      </View>
      <Text variant="small" tone="low" style={{ marginBottom: 6 }}>
        {note}
      </Text>

      {upgradeUnlocked && upgrade && (
        <Pressable
          onPress={() => toggleUpgrade(date, exerciseId)}
          style={{
            alignSelf: 'flex-start',
            height: 32,
            paddingHorizontal: 12,
            borderRadius: 9,
            justifyContent: 'center',
            marginBottom: 6,
            borderWidth: 1,
            backgroundColor: upgraded ? t.sageBg : 'transparent',
            borderColor: upgraded ? t.sageBorder : t.line2,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: upgraded ? t.sageDeep : t.low,
            }}
          >
            {upgraded ? `✓ ${upgrade.name}` : `Upgrade: ${upgrade.name}`}
          </Text>
        </Pressable>
      )}

      <View>
        {setRows.map((set, idx) => {
          const last = previousSets[idx];
          const isSelected = selectedSet === idx;
          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: 56,
                borderBottomWidth: 1,
                borderBottomColor: t.line,
              }}
            >
              <Text variant="mono" tone="low" style={{ width: 22 }}>
                S{idx + 1}
              </Text>
              <Pressable
                onPress={() =>
                  setSelectedSet((cur) => (cur === idx ? null : idx))
                }
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 5,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? t.line : 'transparent',
                  opacity: set.done ? 0.55 : 1,
                }}
              >
                <Text style={{ fontFamily: fonts.monoMedium, fontSize: 17, color: t.hi }}>
                  {time ? set.weight : fmtW(set.weight)}
                </Text>
                <Text tone="low" style={{ fontSize: 12 }}>
                  {time ? ' s /' : ' kg ×'}
                </Text>
                <Text style={{ fontFamily: fonts.monoMedium, fontSize: 17, color: t.hi }}>
                  {time ? 'side' : set.reps}
                </Text>
              </Pressable>
              <Text variant="mono" tone="low" style={{ fontSize: 11.5 }}>
                {last
                  ? `prev ${last.weight}${time ? 's' : ` × ${last.reps}`}`
                  : ''}
              </Text>
              <Pressable
                onPress={() => onCheck(idx)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: set.done ? t.sage : 'transparent',
                  borderWidth: set.done ? 0 : 1,
                  borderColor: t.line3,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: set.done ? t.onAccent : 'transparent',
                  }}
                >
                  ✓
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {selectedSet != null && !time && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 10,
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: t.raise,
          }}
        >
          <StepperBtn label="−2.5" onPress={() => adjust(-2.5, 0)} />
          <Text style={{ flex: 1, textAlign: 'center', color: t.hi, fontFamily: fonts.monoMedium, fontSize: 15 }}>
            {fmtW(setRows[selectedSet].weight)} kg
          </Text>
          <StepperBtn label="+2.5" onPress={() => adjust(2.5, 0)} />
          <View style={{ width: 1, height: 26, backgroundColor: t.line2 }} />
          <StepperBtn label="−1" onPress={() => adjust(0, -1)} />
          <Text style={{ width: 28, textAlign: 'center', color: t.hi, fontFamily: fonts.monoMedium, fontSize: 15 }}>
            {setRows[selectedSet].reps}
          </Text>
          <StepperBtn label="+1" onPress={() => adjust(0, 1)} />
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
        }}
      >
        <Text style={{ fontSize: 10, letterSpacing: 2, color: t.low, width: 30 }}>
          RPE
        </Text>
        {[6, 7, 8, 9, 10].map((v) => {
          const active = rpe === v;
          return (
            <Pressable
              key={v}
              onPress={() => setRpe(date, exerciseId, v)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? t.hi : t.raise,
                borderWidth: 1,
                borderColor: active ? 'transparent' : t.line2,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: active ? t.bg : t.mid,
                }}
              >
                {v}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function StepperBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTokens();
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 44,
        minWidth: 54,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        backgroundColor: t.raise2,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: t.hi }}>
        {label}
      </Text>
    </Pressable>
  );
}

function fmtW(w: number) {
  return w % 1 === 0 ? String(w) : w.toFixed(1);
}

function findPreviousLog(
  gymLogs: Record<string, GymLog>,
  forDate: string,
  sessionId: 'gym_a' | 'gym_b',
) {
  const candidates = Object.values(gymLogs)
    .filter((l) => l.sessionId === sessionId && l.date < forDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return candidates[0];
}

// referenced for symmetry only — actual styles inline
StyleSheet.create({ x: { display: 'none' } });
