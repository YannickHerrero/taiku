import { useState } from 'react';
import { View } from 'react-native';

import { EveningView } from '@/components/EveningView';
import { MorningView } from '@/components/MorningView';
import { PreStartView } from '@/components/PreStartView';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import {
  dateFromYmd,
  resolveSessionForDate,
  totalProgramDays,
} from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatLongDate } from '@/util/format';

type Part = 'morning' | 'evening';

export default function TodayScreen() {
  const t = useTokens();
  const startDate = useStore((s) => s.settings.startDate);
  const today = resolveSessionForDate(dateFromYmd(startDate), new Date());
  const [part, setPart] = useState<Part>(() =>
    new Date().getHours() >= 18 ? 'evening' : 'morning',
  );

  const isPreStart = today.phase === 'before';
  const isPostEnd = today.phase === 'after';

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 24,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 4 }}>
          TAIKU
        </Text>
        <Text variant="mono" tone="low">
          {isPreStart
            ? `STARTS IN ${today.daysUntilStart}D`
            : isPostEnd
              ? 'PROGRAM COMPLETE'
              : `DAY ${today.dayOfProgram} / ${totalProgramDays()}`}
        </Text>
      </View>

      <Text variant="h2" style={{ marginBottom: 14 }}>
        {formatLongDate(new Date())}
      </Text>

      {isPreStart ? (
        <PreStartView today={today} startDate={dateFromYmd(startDate)} />
      ) : isPostEnd ? (
        <PostEndView />
      ) : (
        <>
          <View style={{ marginBottom: 22 }}>
            <Segmented<Part>
              items={[
                { value: 'morning', label: 'Morning' },
                { value: 'evening', label: 'Evening' },
              ]}
              value={part}
              onChange={setPart}
            />
          </View>

          {part === 'morning' ? (
            <MorningView today={today} />
          ) : (
            <EveningView today={today} />
          )}

          <Text variant="small" tone="low" style={{ marginTop: 16, textAlign: 'center' }}>
            Block {today.block} ·{' '}
            {today.weekType === 'deload' ? 'Deload' : 'Build'} · {today.weekLabel}
          </Text>
        </>
      )}

      <View style={{ height: 1, backgroundColor: t.bg }} />
    </Screen>
  );
}

function PostEndView() {
  return (
    <View>
      <Text variant="h3" style={{ marginBottom: 8 }}>
        Program complete.
      </Text>
      <Text variant="intent" tone="intent">
        Time to plan the next cycle. Open Settings to set a new start date.
      </Text>
    </View>
  );
}
