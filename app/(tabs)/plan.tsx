import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import {
  addDays,
  dateFromYmd,
  PROGRAM,
  resolveSessionForDate,
  ymd,
} from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatNumericDate, pad2 } from '@/util/format';

export default function PlanScreen() {
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const gymLogs = useStore((s) => s.gymLogs);
  const mobLogs = useStore((s) => s.mobilityLogs);
  const runLogs = useStore((s) => s.runLogs);
  const start = dateFromYmd(startDate);
  const today = resolveSessionForDate(start, new Date());

  const isStarted = today.phase !== 'before';
  const isFinished = today.phase === 'after';

  const rows = useMemo(
    () =>
      PROGRAM.weeks.map((w) => {
        const weekStart = addDays(start, (w.week - 1) * 7);
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        const dayResolves = days.map((d) => resolveSessionForDate(start, d));
        const isCurrent = isStarted && !isFinished && w.week === today.weekNumber;
        const isPast = isStarted && w.week < today.weekNumber;
        const dotStates = dayResolves.map((r) => {
          if (!isStarted) return 'planned';
          const isToday = r.date === today.date;
          if (isToday) return 'today';
          const gym = !!gymLogs[r.date]?.completedAt;
          const mob = !!mobLogs[r.date]?.completedAt;
          const run = !!runLogs[r.date]?.done;
          if (gym || mob || run) return 'done';
          if (r.date < today.date) return 'missed';
          return 'planned';
        });
        return {
          ...w,
          isCurrent,
          isPast,
          dotStates,
          rangeStart: ymd(weekStart),
        };
      }),
    [start, today, gymLogs, mobLogs, runLogs, isStarted, isFinished],
  );

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <Text variant="h1">90 days</Text>
        <Text variant="mono" tone="low">
          {today.phase === 'before'
            ? `STARTS IN ${today.daysUntilStart}D`
            : today.phase === 'after'
              ? 'COMPLETE'
              : `DAY ${today.dayOfProgram} · WK ${today.weekNumber}`}
        </Text>
      </View>
      <Text variant="small" tone="low" style={{ marginBottom: 18 }}>
        13 weeks · 3 blocks ·{' '}
        {today.phase === 'before' ? 'starts' : 'started'} {formatNumericDate(start)}
      </Text>

      {rows.map((w) => {
        const isDeload = w.type === 'deload';
        return (
          <View
            key={w.week}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 14,
              marginBottom: 7,
              borderWidth: 1,
              backgroundColor: w.isCurrent
                ? t.raise
                : isDeload
                  ? t.sageBg
                  : t.card,
              borderColor: w.isCurrent
                ? t.line3
                : isDeload
                  ? t.sageBorder
                  : t.line,
            }}
          >
            <Text
              variant="mono"
              style={{
                width: 22,
                color: w.isCurrent ? t.hi : isDeload ? t.sageDeep : t.low,
              }}
            >
              {pad2(w.week)}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12.5,
                  marginBottom: 7,
                  fontFamily: w.isCurrent ? fonts.bodySemi : fonts.body,
                  color: w.isCurrent ? t.hi : isDeload ? t.sageDeep : t.mid,
                }}
              >
                B{w.block} · {w.label}
                {w.isCurrent ? ' — now' : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {w.dotStates.map((state, i) => (
                  <View
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3.5,
                      backgroundColor: dotColor(state, isDeload, t),
                      borderWidth: state === 'missed' ? 1 : 0,
                      borderColor: state === 'missed' ? t.line3 : 'transparent',
                    }}
                  />
                ))}
              </View>
            </View>
            <Text
              variant="mono"
              style={{
                color: w.isCurrent ? t.hi : isDeload ? t.sageDeep : t.low,
              }}
            >
              {w.isPast ? '✓' : w.isCurrent ? 'now' : ''}
            </Text>
          </View>
        );
      })}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 14,
          marginTop: 16,
          marginBottom: 18,
        }}
      >
        <Legend swatch={t.done} label="done" />
        <Legend swatch={t.sage} label="adjusted" />
        <Legend swatch="transparent" label="missed" border={t.line3} />
        <Legend swatch={t.sageFaint} label="deload" border={t.sageBorder} />
      </View>

      <Pressable
        onPress={() => router.push('/stats')}
        style={{
          flexDirection: 'row',
          gap: 12,
          borderRadius: 16,
          backgroundColor: t.card,
          borderColor: t.line,
          borderWidth: 1,
          padding: 18,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="overline" tone="low" style={{ marginBottom: 6 }}>
            SINCE DAY 1
          </Text>
          <Text variant="mono" style={{ fontSize: 14 }}>
            View stats →
          </Text>
        </View>
        <Text variant="small" tone="sage">
          Stats →
        </Text>
      </Pressable>

      <Text variant="small" tone="sage" style={{ textAlign: 'center' }}>
        Deload weeks are where the gains land. Protect them.
      </Text>
    </Screen>
  );
}

function dotColor(
  state: string,
  deload: boolean,
  t: ReturnType<typeof useTokens>,
) {
  if (state === 'today') return t.hi;
  if (state === 'done') return deload ? t.sage : t.done;
  if (state === 'missed') return 'transparent';
  return deload ? t.sageFaint : t.line2;
}

function Legend({
  swatch,
  label,
  border,
}: {
  swatch: string;
  label: string;
  border?: string;
}) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: swatch,
          borderWidth: border ? 1 : 0,
          borderColor: border ?? 'transparent',
        }}
      />
      <Text variant="small" tone="low">
        {label}
      </Text>
    </View>
  );
}
