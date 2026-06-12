import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';

import { useStore } from '@/store';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { pad2 } from '@/util/format';

export function RestTimer() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const rest = useStore((s) => s.rest);
  const stopRest = useStore((s) => s.stopRest);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!rest.endsAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [rest.endsAt]);

  if (!rest.endsAt || !rest.totalSeconds) return null;
  const remainMs = rest.endsAt - Date.now();
  if (remainMs <= 0) {
    return null;
  }
  const remainS = Math.ceil(remainMs / 1000);
  const min = Math.floor(remainS / 60);
  const sec = remainS % 60;
  const pct = (remainMs / (rest.totalSeconds * 1000)) * 100;

  return (
    <View
      style={[
        styles.host,
        {
          bottom: Math.max(insets.bottom, 12) + 60,
          backgroundColor: t.raise,
          borderColor: t.line3,
        },
      ]}
    >
      <Text style={{ fontSize: 10, letterSpacing: 2, color: t.low }}>REST</Text>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 22,
          color: t.hi,
          marginHorizontal: 6,
        }}
      >
        {min}:{pad2(sec)}
      </Text>
      <View
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          backgroundColor: t.line2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, pct))}%`,
            backgroundColor: t.sage,
          }}
        />
      </View>
      <Pressable
        onPress={stopRest}
        style={[styles.skip, { borderColor: t.line3 }]}
      >
        <Text style={{ fontSize: 13, color: t.mid }}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  skip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
