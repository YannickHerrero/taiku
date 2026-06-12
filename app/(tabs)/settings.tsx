import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Platform, Pressable, View } from 'react-native';
import { useState } from 'react';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { PROGRAM, addDays, dateFromYmd, ymd } from '@/data/program';
import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { formatNumericDate } from '@/util/format';

export default function SettingsScreen() {
  const t = useTokens();
  const settings = useStore((s) => s.settings);
  const setTheme = useStore((s) => s.setTheme);
  const setStartDate = useStore((s) => s.setStartDate);
  const setStravaConnected = useStore((s) => s.setStravaConnected);
  const resetAll = useStore((s) => s.resetAll);
  const [pickerOpen, setPickerOpen] = useState(false);

  const start = dateFromYmd(settings.startDate);
  const end = addDays(start, PROGRAM.weeks.length * 7 - 1);

  const confirmReset = () => {
    Alert.alert(
      'Reset everything?',
      'All logs, check-ins, and settings will be wiped.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetAll },
      ],
    );
  };

  return (
    <Screen>
      <Text variant="h1" style={{ marginBottom: 20 }}>
        Settings
      </Text>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 12 }}>
          Appearance
        </Text>
        <Segmented
          items={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ]}
          value={settings.theme}
          onChange={setTheme}
        />
        <Text variant="small" tone="low" style={{ marginTop: 10 }}>
          Dark is the default — easier on 5:45 alarms.
        </Text>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 12 }}>
          Connections
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              backgroundColor: '#FC5200',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontFamily: fonts.bodyBold }}>S</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" style={{ fontSize: 15 }}>
              Strava
            </Text>
            <Text variant="small" tone="low">
              {settings.stravaConnected
                ? 'Connected — auto-import coming soon'
                : 'Auto-import runs and pace (placeholder)'}
            </Text>
          </View>
          <Pressable
            onPress={() => setStravaConnected(!settings.stravaConnected)}
            style={{
              height: 38,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: settings.stravaConnected ? t.sageBg : 'transparent',
              borderColor: settings.stravaConnected ? t.sageBorder : t.line3,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodySemi,
                fontSize: 13,
                color: settings.stravaConnected ? t.sageDeep : t.hi,
              }}
            >
              {settings.stravaConnected ? 'Connected ✓' : 'Connect'}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text variant="overline" tone="low" style={{ marginBottom: 12 }}>
          Program
        </Text>
        <SettingsRow label="Started" value={formatNumericDate(start)}>
          <Pressable onPress={() => setPickerOpen(true)}>
            <Text variant="small" tone="sage" style={{ fontFamily: fonts.bodySemi }}>
              Change
            </Text>
          </Pressable>
        </SettingsRow>
        <SettingsRow label="Ends" value={formatNumericDate(end)} />
        <SettingsRow label="Structure" value="3 blocks · 13 wks" />
        <SettingsRow label="Units" value="kg · km" />
        <SettingsRow label="Week starts" value="Monday" />

        {pickerOpen && (
          <DateTimePicker
            value={start}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_e, selected) => {
              if (Platform.OS !== 'ios') setPickerOpen(false);
              if (selected) setStartDate(ymd(selected));
            }}
          />
        )}
        {pickerOpen && Platform.OS === 'ios' && (
          <Pressable
            onPress={() => setPickerOpen(false)}
            style={{
              alignSelf: 'flex-end',
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginTop: 8,
            }}
          >
            <Text variant="small" tone="sage" style={{ fontFamily: fonts.bodySemi }}>
              Done
            </Text>
          </Pressable>
        )}
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.bodyBold, letterSpacing: 4, fontSize: 12 }}>
          TAIKU
        </Text>
        <Text variant="mono" tone="low" style={{ marginTop: 8, marginBottom: 12 }}>
          PRIVATE BUILD 0.1 · JUNE 2026
        </Text>
        <Text variant="intent" tone="intent">
          {PROGRAM.program.philosophy}
        </Text>
      </Card>

      <Pressable
        onPress={confirmReset}
        style={{
          alignSelf: 'center',
          paddingVertical: 12,
          paddingHorizontal: 18,
          marginTop: 12,
        }}
      >
        <Text variant="small" tone="ember">
          Reset all data
        </Text>
      </Pressable>

      <Text variant="small" tone="low" style={{ textAlign: 'center', marginTop: 18 }}>
        All data stays on this phone.
      </Text>
    </Screen>
  );
}

function SettingsRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  const t = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: t.line,
      }}
    >
      <Text variant="small" tone="mid">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="mono">{value}</Text>
        {children}
      </View>
    </View>
  );
}
