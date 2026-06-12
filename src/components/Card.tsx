import {
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';

interface Props {
  tone?: 'card' | 'sage' | 'raise';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Card({ tone = 'card', style, children }: Props) {
  const t = useTokens();
  const tones: Record<string, ViewStyle> = {
    card: { backgroundColor: t.card, borderColor: t.line },
    sage: { backgroundColor: t.sageBg, borderColor: t.sageBorder },
    raise: { backgroundColor: t.raise, borderColor: t.line3 },
  };
  return (
    <View
      style={[
        {
          borderRadius: 16,
          borderWidth: 1,
          paddingVertical: 16,
          paddingHorizontal: 18,
        },
        tones[tone],
        style,
      ]}
    >
      {children}
    </View>
  );
}
