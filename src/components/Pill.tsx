import { StyleSheet, Text, View } from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type Variant = 'sage' | 'ember' | 'mid';

interface Props {
  label: string;
  variant?: Variant;
}

export function Pill({ label, variant = 'mid' }: Props) {
  const t = useTokens();
  const colors = {
    sage: { bg: t.sage, color: t.onAccent },
    ember: { bg: t.ember, color: t.onAccent },
    mid: { bg: t.raise2, color: t.hi },
  }[variant];
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: fonts.bodyBold,
  },
});
