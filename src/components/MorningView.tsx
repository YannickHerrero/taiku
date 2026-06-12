import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from './Card';
import { SessionTag } from './SessionTag';
import { Text } from './Text';

import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { clamp, formatWeight } from '@/util/format';
import type { ResolvedSession } from '@/data/types';

interface Props {
  today: ResolvedSession;
}

const LEGS_WORDS = ['tap to rate', 'trashed', 'heavy', 'okay', 'good', 'springy'];

function sleepWord(score: number) {
  if (score < 60) return 'rough';
  if (score < 80) return 'fair';
  return 'good';
}

export function MorningView({ today }: Props) {
  const t = useTokens();
  const checkIn = useStore((s) => s.checkIns[today.date]);
  const saveCheckIn = useStore((s) => s.saveCheckIn);
  const weight = checkIn?.weightKg ?? 70;
  const sleep = checkIn?.sleepScore ?? 70;
  const legs = checkIn?.legsFeel ?? 0;

  const setWeight = (next: number) =>
    saveCheckIn({
      date: today.date,
      weightKg: Math.round(clamp(next, 30, 200) * 10) / 10,
    });
  const setSleep = (next: number) =>
    saveCheckIn({
      date: today.date,
      sleepScore: Math.round(clamp(next, 0, 100)),
    });
  const setLegs = (next: 1 | 2 | 3 | 4 | 5) =>
    saveCheckIn({ date: today.date, legsFeel: next });

  const sw = sleepWord(sleep);
  const session = today.session;
  const reduced = today.isDeload;

  return (
    <View>
      <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
        Check-in
      </Text>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
          Weight
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setWeight(weight - 0.1)}
            style={[styles.rnd, { backgroundColor: t.raise, borderColor: t.line2 }]}
          >
            <Text style={{ color: t.hi, fontSize: 24 }}>−</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <Text variant="monoNum">{formatWeight(weight)}</Text>
            <Text style={{ marginLeft: 4 }} tone="low">
              {' kg'}
            </Text>
          </View>
          <Pressable
            onPress={() => setWeight(weight + 0.1)}
            style={[styles.rnd, { backgroundColor: t.raise, borderColor: t.line2 }]}
          >
            <Text style={{ color: t.hi, fontSize: 24 }}>+</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text variant="overline" tone="low">
            Sleep score
          </Text>
          <Text style={{ color: sleep < 60 ? t.ember : t.mid, fontSize: 13 }}>{sw}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text variant="monoNum" style={{ width: 64 }}>
            {sleep}
          </Text>
          <Slider
            style={{ flex: 1, height: 36 }}
            minimumValue={0}
            maximumValue={100}
            value={sleep}
            step={1}
            onValueChange={setSleep}
            minimumTrackTintColor={t.line3}
            maximumTrackTintColor={t.line3}
            thumbTintColor={t.hi}
          />
        </View>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text variant="overline" tone="low">
            Legs feel
          </Text>
          <Text variant="small" tone="mid">
            {LEGS_WORDS[legs]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((v) => {
            const active = legs === v;
            const isLow = v <= 2;
            return (
              <Pressable
                key={v}
                onPress={() => setLegs(v as 1 | 2 | 3 | 4 | 5)}
                style={[
                  styles.legBtn,
                  {
                    backgroundColor: active
                      ? isLow
                        ? t.emberBg
                        : t.sageBg
                      : t.raise,
                    borderColor: active
                      ? isLow
                        ? t.emberBorder
                        : t.sageBorder
                      : t.line2,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: fonts.monoMedium,
                    fontSize: 18,
                    color: active ? t.hi : t.mid,
                  }}
                >
                  {v}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text variant="overline" tone="low" style={{ marginTop: 20, marginBottom: 10 }}>
        Today
      </Text>

      <View
        style={{
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          backgroundColor: reduced ? t.sageBg : t.card,
          borderColor: reduced ? t.sageBorder : t.line2,
        }}
      >
        <View style={{ marginBottom: 12, flexDirection: 'row' }}>
          <SessionTag session={session} reduced={reduced} />
        </View>
        <Text variant="h3" style={{ marginBottom: 4 }}>
          {session.title}
        </Text>
        <Text
          tone="mid"
          variant="mono"
          style={{ marginBottom: 12, fontSize: 12.5 }}
        >
          {todayMeta(today)}
        </Text>
        <Text variant="intent" tone="intent">
          {reduced
            ? 'Dropped to deload volume. Protecting the plan beats forcing it.'
            : today.weekNote || sessionIntent(session)}
        </Text>

        {session.type === 'gym' && (
          <Pressable
            onPress={() => router.push('/gym')}
            style={[
              styles.cta,
              { backgroundColor: t.raise, borderColor: t.line2 },
            ]}
          >
            <Text style={{ fontFamily: fonts.bodySemi, color: t.hi, fontSize: 14 }}>
              Enter gym mode →
            </Text>
          </Pressable>
        )}

        {session.type === 'mobility' && (
          <Pressable
            onPress={() => router.push('/mobility')}
            style={[
              styles.cta,
              { backgroundColor: t.raise, borderColor: t.line2 },
            ]}
          >
            <Text style={{ fontFamily: fonts.bodySemi, color: t.hi, fontSize: 14 }}>
              Open mobility checklist →
            </Text>
          </Pressable>
        )}

        {session.type === 'run' && <RunMarkDone date={today.date} sessionId={today.sessionId} />}
      </View>
    </View>
  );
}

function RunMarkDone({ date, sessionId }: { date: string; sessionId: string }) {
  const t = useTokens();
  const run = useStore((s) => s.runLogs[date]);
  const setRunDone = useStore((s) => s.setRunDone);
  const done = run?.done ?? false;
  return (
    <Pressable
      onPress={() => setRunDone(date, sessionId, !done)}
      style={[
        styles.cta,
        {
          backgroundColor: done ? t.sageBg : t.raise,
          borderColor: done ? t.sageBorder : t.line2,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          color: done ? t.sageDeep : t.hi,
          fontSize: 14,
        }}
      >
        {done ? '✓ Marked done · tap to undo' : 'Mark run done (logged on Garmin)'}
      </Text>
    </Pressable>
  );
}

function todayMeta(today: ResolvedSession) {
  const s = today.session;
  if (today.isDeload && s.type === 'gym') return '2 SETS · 60% LOAD · ~40 MIN';
  if (s.type === 'gym')
    return `${s.durationMinutes} MIN · ${s.exercises.length} EXERCISES · RIR ${prescribedRir(today)}`;
  if (s.type === 'mobility')
    return `${s.durationMinutes} MIN · ${s.drills.length} DRILLS`;
  return s.subtype.toUpperCase();
}

function sessionIntent(session: ResolvedSession['session']) {
  if (session.type === 'gym') return '';
  return session.intent;
}

function prescribedRir(today: ResolvedSession) {
  const sample = Object.values(today.prescriptions).find((p) => p.rir !== null);
  return sample?.rir ?? 2;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rnd: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    height: 48,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
