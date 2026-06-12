import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

interface Props {
  data: number[];
  width?: number | string;
  height?: number;
  stroke: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = '100%',
  height = 28,
  stroke,
  strokeWidth = 1.5,
}: Props) {
  if (data.length < 2) {
    return <View style={{ height }} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.0001, max - min);
  const N = data.length;
  const points = data
    .map((v, i) => {
      const x = (i / (N - 1)) * 100;
      const y = ((max - v) / range) * 26 + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <View style={{ width: '100%', height }}>
      <Svg
        width="100%"
        height={height}
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
      >
        <Polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
}
