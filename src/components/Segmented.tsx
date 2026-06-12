import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

interface Item<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  items: Item<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function Segmented<T extends string>({ items, value, onChange }: Props<T>) {
  const t = useTokens();
  return (
    <View
      style={[styles.container, { backgroundColor: t.raise }]}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <Pressable
            key={it.value}
            onPress={() => onChange(it.value)}
            style={[
              styles.btn,
              {
                backgroundColor: active ? t.seg : 'transparent',
                shadowColor: '#000',
                shadowOpacity: active ? 0.18 : 0,
                shadowRadius: active ? 4 : 0,
                shadowOffset: { width: 0, height: 1 },
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13.5,
                fontFamily: active ? fonts.bodySemi : fonts.bodyMedium,
                color: active ? t.hi : t.low,
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
