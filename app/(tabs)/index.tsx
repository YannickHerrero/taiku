import { Text, View } from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function TodayPlaceholder() {
  const t = useTokens();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.hi, letterSpacing: 4, fontFamily: fonts.bodySemi }}>
        TAIKU
      </Text>
    </View>
  );
}
