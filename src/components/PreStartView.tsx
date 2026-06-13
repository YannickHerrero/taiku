import { View } from 'react-native';

import { Card } from './Card';
import { SessionTag } from './SessionTag';
import { Text } from './Text';

import { PROGRAM, resolveSessionForDate } from '@/data/program';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatLongDate } from '@/util/format';
import type { ResolvedSession } from '@/data/types';

interface Props {
  today: ResolvedSession;
  startDate: Date;
}

export function PreStartView({ today, startDate }: Props) {
  const t = useTokens();
  const day1 = resolveSessionForDate(startDate, startDate);
  const days = today.daysUntilStart;

  return (
    <View>
      <Card tone="sage" style={{ marginBottom: 14 }}>
        <Text variant="overline" tone="sage" style={{ marginBottom: 10 }}>
          Program starts
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <Text style={{ fontFamily: fonts.monoMedium, fontSize: 52, color: t.hi, lineHeight: 52 }}>
            {days}
          </Text>
          <Text tone="mid" style={{ fontSize: 17 }}>
            {days === 1 ? 'day' : 'days'} to go
          </Text>
        </View>
        <Text variant="small" tone="intent">
          {formatLongDate(startDate)} · {PROGRAM.weeks.length} weeks
        </Text>
      </Card>

      <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
        Day 1 preview
      </Text>
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <SessionTag session={day1.session} />
        </View>
        <Text variant="h3" style={{ marginBottom: 6 }}>
          {day1.session.title}
        </Text>
        <Text variant="intent" tone="intent">
          {day1Intent(day1)}
        </Text>
      </Card>

      <Card>
        <Text variant="overline" tone="low" style={{ marginBottom: 10 }}>
          Why this plan
        </Text>
        <Text variant="intent" tone="intent">
          {PROGRAM.program.philosophy}
        </Text>
      </Card>

      <Text variant="small" tone="low" style={{ marginTop: 22, textAlign: 'center' }}>
        Rest up. The first week is meant to feel too easy.
      </Text>
    </View>
  );
}

function day1Intent(day1: ResolvedSession) {
  if (day1.session.type === 'gym') return day1.weekNote;
  return day1.session.intent;
}
