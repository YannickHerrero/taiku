import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';

import { Text } from './Text';
import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

interface Props {
  pct: number;
  size?: number;
}

export function Ring({ pct, size = 76 }: Props) {
  const t = useTokens();
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.line2}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.sage}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash},${c}`}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.monoMedium, fontSize: 16, color: t.hi }}>
          {Math.round(pct)}%
        </Text>
      </View>
    </View>
  );
}
