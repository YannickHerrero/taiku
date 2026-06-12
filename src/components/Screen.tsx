import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  topInsetExtra?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = true,
  topInsetExtra = 0,
  contentStyle,
}: Props) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + 20 + topInsetExtra;
  const padding = {
    paddingTop,
    paddingHorizontal: 20,
    paddingBottom: 28,
  };

  if (!scroll) {
    return (
      <View
        style={[
          { flex: 1, backgroundColor: t.bg, ...padding },
          contentStyle,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
