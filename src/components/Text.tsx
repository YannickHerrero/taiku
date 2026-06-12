import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useTokens } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'intent'
  | 'small'
  | 'overline'
  | 'mono'
  | 'monoLarge'
  | 'monoNum';

const styles: Record<Variant, TextStyle> = {
  h1: { fontFamily: fonts.bodySemi, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.bodySemi, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 22 },
  intent: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  monoLarge: { fontFamily: fonts.monoMedium, fontSize: 17 },
  monoNum: { fontFamily: fonts.monoMedium, fontSize: 40, lineHeight: 44 },
};

const toneMap = {
  hi: 'hi',
  mid: 'mid',
  low: 'low',
  intent: 'intent',
  sage: 'sageDeep',
  ember: 'ember',
  onAccent: 'onAccent',
  done: 'done',
} as const;

type Tone = keyof typeof toneMap;

interface Props extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Text({
  variant = 'body',
  tone = 'hi',
  style,
  children,
  ...rest
}: Props) {
  const t = useTokens();
  const color = (t as unknown as Record<string, string>)[toneMap[tone]];
  return (
    <RNText style={[styles[variant], { color }, style]} {...rest}>
      {children}
    </RNText>
  );
}
