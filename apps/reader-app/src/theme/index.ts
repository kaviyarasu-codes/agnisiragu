// src/theme/index.ts

export interface AppTheme {
  bg:       string;
  bgAlt:    string;
  surface:  string;
  card:     string;
  ink:      string;
  inkSub:   string;
  inkMuted: string;
  border:   string;
  red:      string;
  redSoft:  string;
  tabBg:    string;
  isDark:   boolean;
}

export const lightTheme: AppTheme = {
  bg:       '#FFFFFF',
  bgAlt:    '#F4F4F4',
  surface:  '#FFFFFF',
  card:     '#FFFFFF',
  ink:      '#0A0A0A',
  inkSub:   '#404040',
  inkMuted: '#999999',
  border:   '#ECECEC',
  red:      '#CC1F2D',
  redSoft:  '#FFE8E9',
  tabBg:    '#111111',
  isDark:   false,
};

export const darkTheme: AppTheme = {
  bg:       '#0A0A0A',
  bgAlt:    '#141414',
  surface:  '#1A1A1A',
  card:     '#1E1E1E',
  ink:      '#F0F0F0',
  inkSub:   '#BBBBBB',
  inkMuted: '#606060',
  border:   '#2A2A2A',
  red:      '#E8313F',
  redSoft:  '#3D0F13',
  tabBg:    '#1A1A1A',
  isDark:   true,
};

export const CAT_COLORS: Record<string, string> = {
  politics:      '#2563EB',
  sports:        '#16A34A',
  entertainment: '#9333EA',
  business:      '#D97706',
  technology:    '#0891B2',
  health:        '#DC2626',
  default:       '#CC1F2D',
};
