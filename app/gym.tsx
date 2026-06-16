import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { RestTimer } from '@/components/RestTimer';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { dateFromYmd, resolveSessionForDate } from '@/data/program';
import type { Exercise, GymSession } from '@/data/types';
import { useStore } from '@/store';
import type { GymLog, LoggedExercise, LoggedSet } from '@/store/types';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import {
  buildSkeleton,
  buildVariantSeed,
  findPreviousVariantLog,
  formatPrescriptionShort,
  restSecondsFor,
  variantNameOf,
} from '@/util/gym';

export default function GymScreen() {
  useKeepAwake();
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const today = useMemo(
    () => resolveSessionForDate(dateFromYmd(startDate), new Date()),
    [startDate],
  );
  const session = today.session as GymSession;

  const log = useStore((s) => s.gymLogs[today.date]);
  const allGymLogs = useStore((s) => s.gymLogs);
  const ensureGymLog = useStore((s) => s.ensureGymLog);
  const completeGymSession = useStore((s) => s.completeGymSession);

  useEffect(() => {
    if (!log && today.session.type === 'gym') {
      const skeleton = buildSkeleton(today, allGymLogs);
      ensureGymLog(
        today.date,
        today.sessionId as 'gym_a' | 'gym_b',
        skeleton,
        today.isDeload,
      );
    }
  }, [log, today, ensureGymLog, allGymLogs]);

  const exercises = log?.exercises ?? buildSkeleton(today, allGymLogs);
  const [warmupOpen, setWarmupOpen] = useState(false);

  if (today.session.type !== 'gym') {
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
              Run to gym · ramp sets per exercise
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
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              date={today.date}
              logEx={logEx}
              sessionId={today.sessionId as 'gym_a' | 'gym_b'}
              prescription={today.prescriptions[exercise.id]}
              prescriptionLabel={formatPrescriptionShort(exercise, today)}
              allGymLogs={allGymLogs}
              isDeload={today.isDeload}
            />
          );
        })}

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
  exercise: Exercise;
  date: string;
  logEx: LoggedExercise;
  sessionId: 'gym_a' | 'gym_b';
  prescription: ReturnType<typeof resolveSessionForDate>['prescriptions'][string];
  prescriptionLabel: string;
  allGymLogs: Record<string, GymLog>;
  isDeload: boolean;
}

function ExerciseCard({
  exercise,
  date,
  logEx,
  sessionId,
  prescription,
  prescriptionLabel,
  allGymLogs,
  isDeload,
}: ExerciseCardProps) {
  const t = useTokens();
  const updateSet = useStore((s) => s.updateSet);
  const updateWarmupSet = useStore((s) => s.updateWarmupSet);
  const setRpe = useStore((s) => s.setExerciseRpe);
  const setExerciseVariant = useStore((s) => s.setExerciseVariant);
  const startRest = useStore((s) => s.startRest);
  const rpe = logEx.rpe ?? 0;
  const [selected, setSelected] = useState<
    { kind: 'warmup' | 'working'; index: number } | null
  >(null);

  const variantId = logEx.variantId;
  const displayName = variantNameOf(exercise, variantId);
  const previousLog = useMemo(
    () => findPreviousVariantLog(allGymLogs, date, sessionId, exercise.id, variantId),
    [allGymLogs, date, sessionId, exercise.id, variantId],
  );
  const previousSets =
    previousLog?.exercises.find((e) => e.exerciseId === exercise.id)?.sets ?? [];

  const onCheck = (kind: 'warmup' | 'working', idx: number) => {
    const set =
      kind === 'working' ? logEx.sets[idx] : logEx.warmupSets[idx];
    const next = !set.done;
    if (kind === 'working') updateSet(date, exercise.id, idx, { done: next });
    else updateWarmupSet(date, exercise.id, idx, { done: next });
    if (next) startRest(exercise.id, restSecondsFor(exercise.id));
  };

  const adjust = (dw: number, dr: number) => {
    if (!selected) return;
    const { kind, index } = selected;
    const set = kind === 'working' ? logEx.sets[index] : logEx.warmupSets[index];
    const update = kind === 'working' ? updateSet : updateWarmupSet;
    update(date, exercise.id, index, {
      weight: Math.max(0, Math.round((set.weight + dw) * 10) / 10),
      reps: Math.max(1, set.reps + dr),
    });
  };

  const onPickVariant = (newVariantId: string) => {
    if (newVariantId === variantId) return;
    const newPrev = findPreviousVariantLog(
      allGymLogs,
      date,
      sessionId,
      exercise.id,
      newVariantId,
    );
    const seed = buildVariantSeed(exercise, prescription, newPrev);
    setExerciseVariant(date, exercise.id, newVariantId, seed);
    setSelected(null);
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
      <Text variant="small" tone="low" style={{ marginBottom: 8 }}>
        {exercise.note}
      </Text>

      {exercise.variants.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {exercise.variants.map((v) => {
            const active = v.id === variantId;
            return (
              <Pressable
                key={v.id}
                onPress={() => onPickVariant(v.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 9,
                  borderWidth: 1,
                  backgroundColor: active ? t.sageBg : 'transparent',
                  borderColor: active ? t.sageBorder : t.line2,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: active ? t.sageDeep : t.low,
                    fontFamily: active ? fonts.bodySemi : fonts.body,
                  }}
                >
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!isDeload && logEx.warmupSets.length > 0 && (
        <View style={{ marginBottom: 4 }}>
          {logEx.warmupSets.map((set, idx) => {
            const isSelected =
              selected?.kind === 'warmup' && selected.index === idx;
            return (
              <SetRow
                key={`w${idx}`}
                label={`W${idx + 1}`}
                muted
                set={set}
                isSelected={isSelected}
                lastText=""
                onPick={() =>
                  setSelected((cur) =>
                    cur?.kind === 'warmup' && cur.index === idx
                      ? null
                      : { kind: 'warmup', index: idx },
                  )
                }
                onCheck={() => onCheck('warmup', idx)}
              />
            );
          })}
        </View>
      )}

      {logEx.sets.map((set, idx) => {
        const last = previousSets[idx];
        const isSelected =
          selected?.kind === 'working' && selected.index === idx;
        return (
          <SetRow
            key={`s${idx}`}
            label={`S${idx + 1}`}
            set={set}
            isSelected={isSelected}
            lastText={last ? `prev ${last.weight} × ${last.reps}` : ''}
            onPick={() =>
              setSelected((cur) =>
                cur?.kind === 'working' && cur.index === idx
                  ? null
                  : { kind: 'working', index: idx },
              )
            }
            onCheck={() => onCheck('working', idx)}
          />
        );
      })}

      {selected && (
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
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: t.hi,
              fontFamily: fonts.monoMedium,
              fontSize: 15,
            }}
          >
            {fmtW(
              (selected.kind === 'working'
                ? logEx.sets[selected.index]
                : logEx.warmupSets[selected.index]).weight,
            )}{' '}
            kg
          </Text>
          <StepperBtn label="+2.5" onPress={() => adjust(2.5, 0)} />
          <View style={{ width: 1, height: 26, backgroundColor: t.line2 }} />
          <StepperBtn label="−1" onPress={() => adjust(0, -1)} />
          <Text
            style={{
              width: 28,
              textAlign: 'center',
              color: t.hi,
              fontFamily: fonts.monoMedium,
              fontSize: 15,
            }}
          >
            {
              (selected.kind === 'working'
                ? logEx.sets[selected.index]
                : logEx.warmupSets[selected.index]).reps
            }
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
              onPress={() => setRpe(date, exercise.id, v)}
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

function SetRow({
  label,
  set,
  isSelected,
  lastText,
  muted,
  onPick,
  onCheck,
}: {
  label: string;
  set: LoggedSet;
  isSelected: boolean;
  lastText: string;
  muted?: boolean;
  onPick: () => void;
  onCheck: () => void;
}) {
  const t = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 50,
        borderBottomWidth: 1,
        borderBottomColor: t.line,
        opacity: muted && !set.done ? 0.65 : 1,
      }}
    >
      <Text variant="mono" tone="low" style={{ width: 28 }}>
        {label}
      </Text>
      <Pressable
        onPress={onPick}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 5,
          paddingVertical: 8,
          paddingHorizontal: 8,
          marginHorizontal: -8,
          borderRadius: 8,
          backgroundColor: isSelected ? t.line : 'transparent',
          opacity: set.done ? 0.55 : 1,
        }}
      >
        <Text style={{ fontFamily: fonts.monoMedium, fontSize: 17, color: t.hi }}>
          {fmtW(set.weight)}
        </Text>
        <Text tone="low" style={{ fontSize: 12 }}>
          {' kg ×'}
        </Text>
        <Text style={{ fontFamily: fonts.monoMedium, fontSize: 17, color: t.hi }}>
          {set.reps}
        </Text>
      </Pressable>
      <Text variant="mono" tone="low" style={{ fontSize: 11.5 }}>
        {lastText}
      </Text>
      <Pressable
        onPress={onCheck}
        style={{
          width: 44,
          height: 44,
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
            fontSize: 17,
            color: set.done ? t.onAccent : 'transparent',
          }}
        >
          ✓
        </Text>
      </Pressable>
    </View>
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
