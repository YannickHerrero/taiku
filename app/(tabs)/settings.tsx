import { Text, View } from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';

export default function SettingsPlaceholder() {
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
      <Text style={{ color: t.mid }}>Settings</Text>
    </View>
  );
}
