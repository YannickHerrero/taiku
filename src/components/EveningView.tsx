import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from './Card';
import { SessionTag } from './SessionTag';
import { Text } from './Text';

import {
  PROGRAM,
  addDays,
  dateFromYmd,
  resolveSessionForDate,
} from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatLongDate } from '@/util/format';
import type { ResolvedSession } from '@/data/types';

interface Props {
  today: ResolvedSession;
}

export function EveningView({ today }: Props) {
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const tomorrowDate = addDays(dateFromYmd(today.date), 1);
  const tomorrow = resolveSessionForDate(dateFromYmd(startDate), tomorrowDate);
  const session = tomorrow.session;

  const nextDeloadStart = findNextDeloadStart(today.weekNumber);
  const sameBlockWeeks = PROGRAM.weeks.filter((w) => w.block === today.block);
  const buildWeeksInBlock = sameBlockWeeks.filter((w) => w.type === 'build').length;
  const currentBuildIdx = sameBlockWeeks
    .filter((w) => w.type === 'build')
    .findIndex((w) => w.week === today.weekNumber) + 1;

  return (
    <View>
      <Text variant="overline" tone="low" style={{ marginBottom: 6 }}>
        Tomorrow
      </Text>
      <Text variant="h3" style={{ marginBottom: 14 }}>
        {formatLongDate(tomorrowDate)}
      </Text>

      <View
        style={{
          borderRadius: 20,
          padding: 22,
          borderWidth: 1,
          backgroundColor: t.sageBg,
          borderColor: t.sageBorder,
          marginBottom: 26,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <SessionTag session={session} reduced={tomorrow.isDeload} />
          {session.type === 'mobility' && (
            <Text variant="small" tone="low">
              active recovery · {session.location}
            </Text>
          )}
          {session.type === 'gym' && (
            <Text variant="small" tone="low">
              {session.durationMinutes} min · RIR {prescribedRir(tomorrow)}
            </Text>
          )}
          {session.type === 'run' && (
            <Text variant="small" tone="low">
              {session.subtype}
            </Text>
          )}
        </View>
        <Text variant="h3" style={{ marginBottom: 10 }}>
          {session.title}
        </Text>
        {(session.type === 'mobility' || session.type === 'gym') && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontFamily: fonts.monoMedium, fontSize: 52, color: t.hi, lineHeight: 60 }}>
              {session.durationMinutes}
            </Text>
            <Text tone="mid" style={{ fontSize: 17 }}>
              min
            </Text>
          </View>
        )}
        <Text variant="intent" tone="intent" style={{ marginBottom: 16 }}>
          {sessionIntent(session, tomorrow)}
        </Text>

        {session.type === 'mobility' && (
          <Pressable
            onPress={() => router.push('/mobility')}
            style={[
              styles.cta,
              { borderColor: t.sageBorder, backgroundColor: 'transparent' },
            ]}
          >
            <Text style={{ fontFamily: fonts.bodySemi, color: t.sageDeep, fontSize: 14 }}>
              View {session.drills.length} drills →
            </Text>
          </Pressable>
        )}
        {session.type === 'gym' && (
          <Text variant="small" tone="sage">
            {session.exercises.length} exercises · open from Today’s morning view
          </Text>
        )}
      </View>

      <View style={{ marginBottom: 26 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <Text variant="small" tone="mid">
            Block {today.block} ·{' '}
            {today.weekType === 'deload'
              ? today.weekLabel
              : `Build week ${currentBuildIdx} of ${buildWeeksInBlock}`}
          </Text>
          {nextDeloadStart && (
            <Text variant="small" tone="sage" style={{ fontFamily: fonts.bodyMedium }}>
              {nextDeloadStart.label}
            </Text>
          )}
        </View>
        <ProgressBar weekIndex={today.weekIndex} />
        <Text variant="small" tone="intent" style={{ marginTop: 12 }}>
          “{today.weekNote}”
        </Text>
      </View>

      <WeekStrip today={today} />

      <Text variant="small" tone="low" style={{ textAlign: 'center', marginTop: 22 }}>
        Nothing else tonight. Sleep well.
      </Text>
    </View>
  );
}

function sessionIntent(
  session: ResolvedSession['session'],
  resolved: ResolvedSession,
) {
  if (session.type === 'gym') return resolved.weekNote;
  return session.intent;
}

function prescribedRir(today: ResolvedSession) {
  const sample = Object.values(today.prescriptions).find((p) => p.rir !== null);
  return sample?.rir ?? 2;
}

function findNextDeloadStart(currentWeek: number) {
  const next = PROGRAM.weeks.find(
    (w) => w.type === 'deload' && w.week >= currentWeek,
  );
  if (!next) return null;
  if (next.week === currentWeek) return { label: 'Deload week' };
  const diff = next.week - currentWeek;
  return { label: diff === 1 ? 'Deload starts next week' : `Deload in ${diff} wks` };
}

function ProgressBar({ weekIndex }: { weekIndex: number }) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {PROGRAM.weeks.map((w, idx) => {
        const isCurrent = idx === weekIndex;
        const isPast = idx < weekIndex;
        const isDeload = w.type === 'deload';
        let bg = t.line2;
        if (isCurrent) bg = t.hi;
        else if (isPast) bg = isDeload ? t.sageSoft : t.done;
        else if (isDeload) bg = t.sageFaint;
        return (
          <View
            key={w.week}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
}

function WeekStrip({ today }: { today: ResolvedSession }) {
  const t = useTokens();
  const start = useStore((s) => s.settings.startDate);
  const startDate = dateFromYmd(start);
  const monday = mondayOf(dateFromYmd(today.date));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const gymLogs = useStore((s) => s.gymLogs);
  const mobLogs = useStore((s) => s.mobilityLogs);
  const runLogs = useStore((s) => s.runLogs);

  const dots = days.map((d) => {
    const resolved = resolveSessionForDate(startDate, d);
    const key = resolved.date;
    const isToday = key === today.date;
    const doneGym = !!gymLogs[key]?.completedAt;
    const doneMob = !!mobLogs[key]?.completedAt;
    const doneRun = !!runLogs[key]?.done;
    const done = doneGym || doneMob || doneRun;
    let bg = t.sageFaint;
    if (resolved.session.type === 'run' && resolved.sessionId === 'run_interval')
      bg = done ? t.done : t.ember;
    else if (done) bg = t.done;
    else if (resolved.session.type === 'run') bg = t.sageSoft;
    if (isToday) bg = t.hi;
    return { date: key, dayChar: weekdayLetter(d), bg, isToday };
  });

  const planned = days.map((d) => resolveSessionForDate(startDate, d));
  const plannedRunDates = planned
    .filter((r) => r.session.type === 'run')
    .map((r) => r.date);
  const ranAlready = plannedRunDates.filter((d) => runLogs[d]?.done).length;
  const weekly = plannedRunDates.length;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text variant="overline" tone="low">
          This week
        </Text>
        <Text variant="mono" tone="mid">
          {ranAlready} <Text tone="low" variant="mono">/ {weekly} runs</Text>
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        {dots.map((d) => (
          <View key={d.date} style={{ alignItems: 'center', gap: 9 }}>
            <Text style={{ fontSize: 10, color: d.isToday ? t.hi : t.low }}>
              {d.dayChar}
            </Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: d.bg,
                  borderColor: d.isToday ? t.line2 : 'transparent',
                  borderWidth: d.isToday ? 3 : 0,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  return addDays(d, -day);
}

function weekdayLetter(d: Date) {
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'][(d.getDay() + 6) % 7];
}

const styles = StyleSheet.create({
  cta: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
