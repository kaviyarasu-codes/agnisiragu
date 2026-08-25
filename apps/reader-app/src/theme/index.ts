// src/theme/index.ts
// Design source: Agnisiragu Reader.dc.html (Aug 2026 redesign) — warm
// newsprint palette (cream background, deep ink, Agnisiragu red), replacing
// the earlier white/black theme. Field names are kept stable so existing
// screens reading `t.bg`, `t.ink`, etc. keep working; new fields are additive.

export interface AppTheme {
  bg:           string; // page background — cream in light, near-black in dark
  bgAlt:        string; // secondary background (thumbnail placeholders, chips)
  surface:      string; // card / header / sheet background
  surface2:     string; // slightly-raised surface (rows on top of surface)
  card:         string; // article card background
  ink:          string; // headline text
  inkSub:       string; // body text
  inkMuted:     string; // timestamps, placeholders, disabled
  border:       string; // hairline dividers
  borderStrong: string; // stronger dividers / input focus
  red:          string; // brand red — primary actions, active states
  redDark:      string; // pressed / dark-on-red text
  redSoft:      string; // tinted red background (unread rows, badges)
  ink900:       string; // near-black surfaces (rail, dark buttons, splash)
  gold:         string; // rate-ticker gold figure
  tabBg:        string; // bottom rail / dark bar background
  isDark:       boolean;
}

export const lightTheme: AppTheme = {
  bg:           '#F5F1EB',
  bgAlt:        '#EFEBE5',
  surface:      '#FFFFFF',
  surface2:     '#F5F1EB',
  card:         '#FFFFFF',
  ink:          '#1C1917',
  inkSub:       '#57534E',
  inkMuted:     '#A8A29E',
  border:       '#DDD8D0',
  borderStrong: '#C5BFB8',
  red:          '#CC1F2D',
  redDark:      '#A8181F',
  redSoft:      '#FDF4F4',
  ink900:       '#1C1917',
  gold:         '#E9B84A',
  tabBg:        '#1C1917',
  isDark:       false,
};

export const darkTheme: AppTheme = {
  bg:           '#17130F',
  bgAlt:        '#221D18',
  surface:      '#1F1A15',
  surface2:     '#2A241D',
  card:         '#221D18',
  ink:          '#F5F1EB',
  inkSub:       '#C9C2B8',
  inkMuted:     '#8A8072',
  border:       '#332C24',
  borderStrong: '#463D32',
  red:          '#E8313F',
  redDark:      '#FF6B76',
  redSoft:      '#3A1518',
  ink900:       '#0D0B08',
  gold:         '#E9B84A',
  tabBg:        '#0D0B08',
  isDark:       true,
};

export const CAT_COLORS: Record<string, string> = {
  politics:      '#1565C0',
  sports:        '#E65100',
  entertainment: '#6C3483',
  cinema:        '#6C3483',
  business:      '#2E7D32',
  technology:    '#0891B2',
  health:        '#DC2626',
  crime:         '#7C2D12',
  local:         '#0F766E',
  international: '#4338CA',
  default:       '#CC1F2D',
};
