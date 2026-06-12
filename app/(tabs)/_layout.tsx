import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

interface TabDef {
  name: 'index' | 'week' | 'plan' | 'settings';
  label: string;
}

const TABS: TabDef[] = [
  { name: 'index', label: 'Today' },
  { name: 'week', label: 'Week' },
  { name: 'plan', label: 'Plan' },
  { name: 'settings', label: 'Settings' },
];

export default function TabsLayout() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          backgroundColor: t.tabBg,
          borderTopWidth: 1,
          borderTopColor: t.line,
          paddingHorizontal: 6,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tab: {
          flex: 1,
          alignItems: 'center',
          gap: 5,
          paddingTop: 8,
          paddingBottom: 4,
        },
        dot: {
          width: 4,
          height: 4,
          borderRadius: 2,
        },
        label: {
          fontSize: 10,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          fontFamily: fonts.bodyMedium,
        },
      }),
    [t, insets.bottom],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.bg },
        animation: Platform.OS === 'ios' ? 'shift' : 'none',
      }}
      tabBar={({ state, navigation }) => (
        <View style={styles.bar}>
          {TABS.map((tab, idx) => {
            const focused =
              state.index === idx ||
              (tab.name === 'index' &&
                state.routes[state.index]?.name === 'index');
            return (
              <Pressable
                key={tab.name}
                style={styles.tab}
                onPress={() => navigation.navigate(tab.name)}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: focused ? t.sage : 'transparent' },
                  ]}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: focused ? t.hi : t.low,
                      fontFamily: focused ? fonts.bodySemi : fonts.bodyMedium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
