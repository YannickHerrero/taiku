import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { Screen } from '@/components/Screen';
import { Sparkline } from '@/components/Sparkline';
import { Text } from '@/components/Text';
import { dateFromYmd, resolveSessionForDate } from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatNumericDate } from '@/util/format';
import { buildAllTimeStats } from '@/util/stats';

export default function StatsScreen() {
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const checkIns = useStore((s) => s.checkIns);
  const gymLogs = useStore((s) => s.gymLogs);
  const mobilityLogs = useStore((s) => s.mobilityLogs);
  const runLogs = useStore((s) => s.runLogs);

  const stats = useMemo(
    () =>
      buildAllTimeStats({
        startDate,
        todayDate: new Date(),
        checkIns,
        gymLogs,
        mobilityLogs,
        runLogs,
      }),
    [startDate, checkIns, gymLogs, mobilityLogs, runLogs],
  );

  const today = resolveSessionForDate(dateFromYmd(startDate), new Date());

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}
      >
        <Text variant="small" tone="low">
          ← Plan
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <Text variant="h1">Since day 1</Text>
        <Text variant="mono" tone="low">
          {today.dayOfProgram} / 90
        </Text>
      </View>
      <Text variant="small" tone="low" style={{ marginBottom: 18 }}>
        {formatNumericDate(dateFromYmd(startDate))} · everything logged
      </Text>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
          Running
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.monoMedium, fontSize: 36, color: t.hi }}>
            {stats.totalRunKm.toFixed(1)}
          </Text>
          <Text tone="low" style={{ fontSize: 14 }}>
            km total
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <NumCol label="Runs" value={`${stats.totalRuns}`} />
          <NumCol label="Longest" value={`${stats.longestKm.toFixed(1)}`} />
          <NumCol label="Avg" value={`${stats.avgKm.toFixed(1)}`} />
        </View>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
          Strength
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: fonts.monoMedium, fontSize: 36, color: t.hi }}>
            {(stats.totalTonnage / 1000).toFixed(1)}
          </Text>
          <Text tone="low" style={{ fontSize: 14 }}>
            tonnes lifted
          </Text>
          <View style={{ flex: 1 }} />
          <Text variant="mono" tone="mid">
            {stats.totalGymSessions} <Text variant="mono" tone="low">sessions</Text>
            {' · '}
            {stats.totalSets} <Text variant="mono" tone="low">sets</Text>
          </Text>
        </View>
        {stats.liftProgress.length === 0 ? (
          <Text variant="small" tone="low">
            Log a session to see progress.
          </Text>
        ) : (
          stats.liftProgress.slice(0, 5).map((l) => (
            <View
              key={l.exerciseId}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: t.line,
              }}
            >
              <Text variant="small" tone="mid">
                {l.name}
              </Text>
              <Text variant="mono">
                {l.first} → {l.latest}{' '}
                {l.delta != null && l.delta !== 0 && (
                  <Text
                    variant="mono"
                    tone={l.delta > 0 ? 'sage' : 'ember'}
                    style={{ fontSize: 11 }}
                  >
                    {l.delta > 0 ? '+' : ''}
                    {l.delta}
                  </Text>
                )}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
          Body weight
        </Text>
        {stats.weightDelta != null && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 36,
                color: stats.weightDelta <= 0 ? t.sageDeep : t.hi,
              }}
            >
              {stats.weightDelta > 0 ? '+' : ''}
              {stats.weightDelta}
            </Text>
            <Text tone="low" style={{ fontSize: 14 }}>
              kg since day 1
            </Text>
          </View>
        )}
        {stats.weightSeries.length >= 2 ? (
          <Sparkline
            data={stats.weightSeries.map((p) => p.kg)}
            stroke={t.mid}
            height={34}
          />
        ) : (
          <Text variant="small" tone="low">
            Log weight in the morning check-in to chart it here.
          </Text>
        )}
        {stats.weightStart && stats.weightLatest && (
          <Text variant="mono" tone="low" style={{ marginTop: 8 }}>
            {stats.weightStart.toFixed(1)} → {stats.weightLatest.toFixed(1)} kg
          </Text>
        )}
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: t.line,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <NumCol
            label="Avg sleep"
            value={stats.avgSleep ? `${Math.round(stats.avgSleep)}` : '—'}
          />
          <NumCol
            label="Avg legs"
            value={stats.avgLegs ? `${stats.avgLegs.toFixed(1)}` : '—'}
            suffix="/ 5"
          />
        </View>
      </Card>

      <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Ring pct={stats.consistencyPct} />
        <View style={{ flex: 1 }}>
          <Text variant="overline" tone="low" style={{ marginBottom: 6 }}>
            Consistency
          </Text>
          <Text variant="h3" style={{ marginBottom: 3 }}>
            {stats.totalDone} of {stats.totalPlanned} sessions done
          </Text>
          <Text variant="small" tone="mid">
            Every adjusted session still counts.
          </Text>
        </View>
      </Card>

      <Text variant="small" tone="low" style={{ textAlign: 'center', marginTop: 14 }}>
        Boring is the goal. Keep showing up.
      </Text>
    </Screen>
  );
}

function NumCol({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="small" tone="low" style={{ marginBottom: 3 }}>
        {label}
      </Text>
      <Text variant="mono" style={{ fontSize: 16 }}>
        {value}
        {suffix && (
          <Text variant="mono" tone="low" style={{ fontSize: 11 }}>
            {' '}
            {suffix}
          </Text>
        )}
      </Text>
    </View>
  );
}
