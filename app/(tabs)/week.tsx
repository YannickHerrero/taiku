import { useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { Screen } from '@/components/Screen';
import { Sparkline } from '@/components/Sparkline';
import { Text } from '@/components/Text';
import { dateFromYmd, resolveSessionForDate } from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatShortDate } from '@/util/format';
import { buildWeeklySummary } from '@/util/weekly';

export default function WeekScreen() {
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const checkIns = useStore((s) => s.checkIns);
  const gymLogs = useStore((s) => s.gymLogs);
  const mobilityLogs = useStore((s) => s.mobilityLogs);
  const runLogs = useStore((s) => s.runLogs);

  const summary = useMemo(
    () =>
      buildWeeklySummary({
        startDate: dateFromYmd(startDate),
        targetDate: new Date(),
        checkIns,
        gymLogs,
        mobilityLogs,
        runLogs,
      }),
    [startDate, checkIns, gymLogs, mobilityLogs, runLogs],
  );

  const today = resolveSessionForDate(dateFromYmd(startDate), new Date());

  if (today.phase === 'before') {
    return (
      <Screen>
        <Text variant="overline" tone="low" style={{ marginBottom: 8 }}>
          Weekly review
        </Text>
        <Text variant="h1" style={{ marginBottom: 6 }}>
          Nothing to review yet.
        </Text>
        <Text variant="small" tone="mid">
          Once Week 1 has a few logged sessions, the trends, adherence, and lift
          progressions will show up here.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="overline" tone="low" style={{ marginBottom: 8 }}>
        Week {summary.weekNumber} · {formatShortDate(dateFromYmd(summary.weekStart))} –{' '}
        {formatShortDate(dateFromYmd(summary.weekEnd))}
      </Text>
      <Text variant="h1" style={{ marginBottom: 6 }}>
        {summary.insight}
      </Text>
      <Text variant="small" tone="mid" style={{ marginBottom: 22 }}>
        Block {summary.block} · {summary.weekType === 'deload' ? 'Deload' : 'Build'} ·{' '}
        {summary.weekLabel}
      </Text>

      <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Ring pct={summary.adherencePct} />
        <View style={{ flex: 1 }}>
          <Text variant="overline" tone="low" style={{ marginBottom: 6 }}>
            Adherence
          </Text>
          <Text variant="h3" style={{ marginBottom: 3 }}>
            {summary.doneSessions} of {summary.plannedSessions} sessions done
          </Text>
          <Text variant="small" tone="mid">
            Deload weeks still count. Adjusted sessions count.
          </Text>
        </View>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 14 }}>
          7-day trends
        </Text>

        <TrendRow
          label="Weight"
          data={summary.weights}
          color={t.mid}
          rightText={
            summary.avgWeight ? `${summary.avgWeight.toFixed(1)} kg` : '—'
          }
        />
        <TrendRow
          label="Sleep"
          data={summary.sleeps}
          color={t.mid}
          rightText={
            summary.avgSleep ? `avg ${Math.round(summary.avgSleep)}` : '—'
          }
        />
        <LegsRow data={summary.legs} avg={summary.avgLegs} />
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 14 }}>
          Main lifts · last 5 sessions
        </Text>
        {summary.lifts.length === 0 ? (
          <Text variant="small" tone="low">
            Log a few gym sessions to see strength progress here.
          </Text>
        ) : (
          summary.lifts.slice(0, 5).map((lift) => (
            <View
              key={lift.exerciseId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Text variant="small" tone="mid" style={{ width: 110 }}>
                {lift.name}
              </Text>
              <View style={{ flex: 1 }}>
                <Sparkline
                  data={lift.sets.map((s) => s.weight)}
                  stroke={t.sage}
                />
              </View>
              <Text variant="mono" style={{ width: 88, textAlign: 'right' }}>
                {lift.latest ? `${lift.latest.weight}×${lift.latest.reps}` : '—'}{' '}
                {lift.deltaFromFirst != null && lift.deltaFromFirst !== 0 && (
                  <Text
                    variant="mono"
                    tone={lift.deltaFromFirst > 0 ? 'sage' : 'ember'}
                    style={{ fontSize: 11 }}
                  >
                    {lift.deltaFromFirst > 0 ? '+' : ''}
                    {lift.deltaFromFirst}
                  </Text>
                )}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Text variant="small" tone="low" style={{ textAlign: 'center', marginTop: 14 }}>
        Today is Day {today.dayOfProgram} of 90.
      </Text>
    </Screen>
  );
}

function TrendRow({
  label,
  data,
  color,
  rightText,
}: {
  label: string;
  data: number[];
  color: string;
  rightText: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Text variant="small" tone="mid" style={{ width: 52 }}>
        {label}
      </Text>
      <View style={{ flex: 1 }}>
        <Sparkline data={data} stroke={color} />
      </View>
      <Text variant="mono" style={{ width: 80, textAlign: 'right' }}>
        {rightText}
      </Text>
    </View>
  );
}

function LegsRow({ data, avg }: { data: number[]; avg?: number }) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text variant="small" tone="mid" style={{ width: 52 }}>
        Legs
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 28 }}>
        {data.length === 0
          ? Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, backgroundColor: t.line2, borderRadius: 2 }} />
            ))
          : data.map((v, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4 + v * 4,
                  borderRadius: 2,
                  backgroundColor: v <= 2 ? t.ember : t.done,
                }}
              />
            ))}
      </View>
      <Text
        variant="mono"
        style={{ width: 80, textAlign: 'right', fontFamily: fonts.monoMedium }}
      >
        {avg ? `avg ${avg.toFixed(1)}` : '—'}
      </Text>
    </View>
  );
}
