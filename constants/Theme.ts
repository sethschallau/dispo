/**
 * Industrial Ethereal Theme
 *
 * Chrome finishes, soft gradients, floating elements
 */

export const Theme = {
  // Core palette - Industrial Chrome with Ethereal accents
  colors: {
    // Backgrounds
    background: '#0A0A0C', // Near black with slight blue
    backgroundElevated: '#141418', // Elevated surfaces
    backgroundCard: '#1A1A1F', // Card surfaces
    backgroundGlass: 'rgba(255, 255, 255, 0.03)', // Glassmorphism

    // Chrome metallics
    chrome: '#C0C0C8', // Primary chrome
    chromeBright: '#E8E8EC', // Highlighted chrome
    chromeDim: '#6B6B75', // Muted chrome
    chromeTint: 'rgba(192, 192, 200, 0.1)', // Chrome tint overlay

    // Ethereal accents
    accent: '#7B8CDE', // Soft periwinkle blue
    accentGlow: 'rgba(123, 140, 222, 0.3)', // Glow effect
    accentMuted: '#5A6AAF', // Muted accent

    // Secondary accents
    aurora: '#A8D8EA', // Ethereal cyan
    mist: '#E5E0FF', // Soft lavender
    ember: '#FFB088', // Warm accent

    // Text
    textPrimary: '#FAFAFA',
    textSecondary: '#A0A0A8',
    textMuted: '#606068',

    // Status colors
    success: '#7ECBA1',
    warning: '#F0C674',
    error: '#E88B8B',

    // Borders & dividers
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    divider: 'rgba(255, 255, 255, 0.05)',
  },

  // Shadows for floating effect
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    cardGlow: {
      shadowColor: '#7B8CDE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    button: {
      shadowColor: '#7B8CDE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  // Border radii
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    heading: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    subheading: {
      fontSize: 18,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
    },
    small: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
  },
};

export default Theme;
