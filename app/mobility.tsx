import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { PROGRAM, addDays, dayKeyFromDate, ymd } from '@/data/program';
import type { MobilitySession } from '@/data/types';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

const MOBILITY_DAY = PROGRAM.weeklyTemplate.find(
  (e) => e.sessionId === 'mobility',
)?.day;

export default function MobilityScreen() {
  const t = useTokens();
  const session = PROGRAM.sessions.mobility as MobilitySession;
  const targetDate = useMemo(() => upcomingMobilityDate(), []);
  const dateKey = ymd(targetDate);
  const today = ymd(new Date());
  const isLiveSession = dateKey === today;

  const mobLog = useStore((s) => s.mobilityLogs[dateKey]);
  const toggleMobilityDrill = useStore((s) => s.toggleMobilityDrill);
  const completeMobility = useStore((s) => s.completeMobility);

  const drills = session.drills;
  const doneCount = drills.filter((d) => mobLog?.drillsDone[d.id]).length;

  return (
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
          gap: 12,
          marginBottom: 4,
        }}
      >
        <Text variant="h2" style={{ flex: 1 }}>
          {session.title}
        </Text>
        <Text variant="mono" tone="low">
          {session.durationMinutes} MIN
        </Text>
      </View>
      <Text variant="small" tone="low" style={{ marginBottom: 12 }}>
        {session.location} · {session.equipment.join(' · ')}
      </Text>

      <View
        style={{
          borderRadius: 14,
          padding: 14,
          backgroundColor: t.sageBg,
          borderColor: t.sageBorder,
          borderWidth: 1,
          marginBottom: 16,
        }}
      >
        <Text variant="intent" tone="intent">
          {session.intent}
        </Text>
        {!isLiveSession && (
          <Text variant="small" tone="low" style={{ marginTop: 8 }}>
            Preview — checks save for the scheduled day ({dateKey}).
          </Text>
        )}
      </View>

      {drills.map((drill) => {
        const done = !!mobLog?.drillsDone[drill.id];
        return (
          <View
            key={drill.id}
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-start',
              borderRadius: 16,
              backgroundColor: t.card,
              borderColor: t.line,
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 8,
            }}
          >
            <Pressable
              onPress={() => toggleMobilityDrill(dateKey, drill.id)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? t.sage : 'transparent',
                borderWidth: done ? 0 : 1,
                borderColor: t.line3,
              }}
            >
              <Text style={{ fontSize: 15, color: done ? t.onAccent : 'transparent' }}>
                ✓
              </Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.bodySemi,
                  fontSize: 15,
                  color: t.hi,
                  opacity: done ? 0.5 : 1,
                }}
              >
                {drill.name}
              </Text>
              <Text
                variant="mono"
                style={{ color: t.sageDeep, marginTop: 4 }}
              >
                {drill.prescription}
              </Text>
              <Text variant="small" tone="low" style={{ marginTop: 4 }}>
                {drill.note}
              </Text>
            </View>
          </View>
        );
      })}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 14,
        }}
      >
        <Text variant="mono" tone="low">
          {doneCount} of {drills.length} done
        </Text>
        <Text variant="small" tone="low">
          Long run tomorrow. Keep this gentle.
        </Text>
      </View>

      {isLiveSession && (
        <Pressable
          onPress={() => {
            completeMobility(dateKey);
            router.back();
          }}
          style={{
            marginTop: 16,
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.sage,
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, color: t.onAccent, fontSize: 15 }}>
            Mark session complete
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

function upcomingMobilityDate(): Date {
  const now = new Date();
  if (!MOBILITY_DAY) return now;
  const todayKey = dayKeyFromDate(now);
  if (todayKey === MOBILITY_DAY) return now;
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now, i);
    if (dayKeyFromDate(d) === MOBILITY_DAY) return d;
  }
  return now;
}

