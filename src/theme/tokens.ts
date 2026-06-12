export interface ThemeTokens {
  bg: string;
  card: string;
  raise: string;
  raise2: string;
  seg: string;
  hi: string;
  mid: string;
  low: string;
  intent: string;
  done: string;
  line: string;
  line2: string;
  line3: string;
  sage: string;
  sageDeep: string;
  sageSoft: string;
  sageFaint: string;
  sageBg: string;
  sageBorder: string;
  ember: string;
  emberBg: string;
  emberBorder: string;
  onAccent: string;
  tabBg: string;
}

export const dark: ThemeTokens = {
  bg: '#0C0D0C',
  card: '#121412',
  raise: '#1A1C1A',
  raise2: '#242724',
  seg: '#2A2D2A',
  hi: '#ECEDE9',
  mid: '#A6ACA3',
  low: '#666C64',
  intent: '#C2C7BE',
  done: '#79817A',
  line: 'rgba(255,255,255,0.05)',
  line2: 'rgba(255,255,255,0.09)',
  line3: 'rgba(255,255,255,0.15)',
  sage: '#9FBCA4',
  sageDeep: '#8FA694',
  sageSoft: 'rgba(159,188,164,0.65)',
  sageFaint: 'rgba(159,188,164,0.25)',
  sageBg: 'rgba(159,188,164,0.08)',
  sageBorder: 'rgba(159,188,164,0.3)',
  ember: '#E0593C',
  emberBg: 'rgba(224,90,58,0.1)',
  emberBorder: 'rgba(224,90,58,0.45)',
  onAccent: '#0C0D0C',
  tabBg: 'rgba(12,13,12,0.94)',
};

export const light: ThemeTokens = {
  bg: '#F2F2EE',
  card: '#FFFFFF',
  raise: '#E9EBE6',
  raise2: '#DDE0DA',
  seg: '#FFFFFF',
  hi: '#1B1D1B',
  mid: '#5A605A',
  low: '#878D86',
  intent: '#41463F',
  done: '#9AA098',
  line: 'rgba(0,0,0,0.06)',
  line2: 'rgba(0,0,0,0.10)',
  line3: 'rgba(0,0,0,0.18)',
  sage: '#6F8F76',
  sageDeep: '#54705B',
  sageSoft: 'rgba(111,143,118,0.55)',
  sageFaint: 'rgba(111,143,118,0.22)',
  sageBg: 'rgba(111,143,118,0.10)',
  sageBorder: 'rgba(111,143,118,0.38)',
  ember: '#C74A2E',
  emberBg: 'rgba(199,74,46,0.10)',
  emberBorder: 'rgba(199,74,46,0.45)',
  onAccent: '#FFFFFF',
  tabBg: 'rgba(242,242,238,0.94)',
};

export const fonts = {
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemi: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemi: 'IBMPlexMono_600SemiBold',
} as const;
