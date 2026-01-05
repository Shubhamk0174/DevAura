/**
 * Complete Theme Configuration
 * All theme values consolidated in one file
 */

import { Platform } from "react-native";

// ==========================================
// COLORS
// ==========================================

/**
 * Color palette for the application
 * Modern, vibrant colors with proper contrast
 */

export const lightTheme = {
  // Primary colors - Vibrant blue-purple gradient feel
  primary: "#6366F1", // Indigo
  primaryLight: "#A5B4FC",
  primaryDark: "#4338CA",

  // Accent colors
  accent: "#8B5CF6", // Purple
  accentLight: "#C4B5FD",

  // Background colors - Warm, modern feel
  background: "#FFFFFF",
  backgroundSecondary: "#F8FAFC",
  backgroundTertiary: "#F1F5F9",

  // Text colors
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textLink: "#6366F1",

  // Button text colors
  buttonText: "#FFFFFF",
  buttonTextSecondary: "#0F172A",

  // Icon colors
  icon: "#64748B",
  iconActive: "#6366F1",

  // Tab colors
  tabBackground: "#FFFFFF",
  tabIconDefault: "#94A3B8",
  tabIconSelected: "#6366F1",

  // Border colors
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Status colors - Vibrant and modern
  success: "#10B981", // Emerald
  warning: "#F59E0B", // Amber
  error: "#EF4444", // Red
  info: "#3B82F6", // Blue

  // Utility
  shadow: "rgba(15, 23, 42, 0.08)",
  overlay: "rgba(15, 23, 42, 0.5)",

  // Card colors
  card: "#FFFFFF",
  cardHover: "#F8FAFC",
};

export const darkTheme = {
  // Primary colors - Vibrant on true black
  primary: "#8B5CF6", // Indigo/Purple that pops on black
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",

  // Accent colors
  accent: "#C4B5FD",
  accentLight: "#A78BFA",

  // Background colors - True black theme
  background: "#000000", // Pure black (AMOLED)
  backgroundSecondary: "#0A0A0A", // Near black
  backgroundTertiary: "#121212", // Material-style dark surface

  // Text colors
  text: "#FAFAFA", // Almost white (less eye strain)
  textSecondary: "#B3B3B3",
  textTertiary: "#8A8A8A",
  textLink: "#8B5CF6",

  // Button text colors
  buttonText: "#000000",
  buttonTextSecondary: "#FAFAFA",

  // Icon colors
  icon: "#9CA3AF",
  iconActive: "#8B5CF6",

  // Tab colors
  tabBackground: "#000000",
  tabIconDefault: "#6B7280",
  tabIconSelected: "#8B5CF6",

  // Border colors
  border: "#1F1F1F",
  borderLight: "#141414",

  // Status colors - Tuned for black background
  success: "#22C55E",
  warning: "#FACC15",
  error: "#EF4444",
  info: "#3B82F6",

  // Utility
  shadow: "rgba(0, 0, 0, 0.8)",
  overlay: "rgba(0, 0, 0, 0.85)",

  // Card colors
  card: "#0F0F0F",
  cardHover: "#1A1A1A",
};

// ==========================================
// FONTS
// ==========================================

/**
 * Font configuration for the application
 * Platform-specific font families
 */

export const fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Font sizes
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

// Font weights
export const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ==========================================
// SPACING
// ==========================================

/**
 * Spacing scale for consistent layout
 * Based on 8px grid system
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ==========================================
// UTILITIES
// ==========================================

/**
 * Theme utilities and helper functions
 */

/**
 * Creates styles that adapt to the current theme
 * Useful for creating reusable style objects
 *
 * @example
 * const styles = createThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing.md,
 *   },
 * }));
 */
export function createThemedStyles(stylesFn) {
  return stylesFn;
}

/**
 * Gets color with opacity
 *
 * @param {string} color - Hex color code
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGBA color string
 *
 * @example
 * const semiTransparent = getColorWithOpacity('#FF0000', 0.5);
 */
export function getColorWithOpacity(color, opacity) {
  // Remove # if present
  const hex = color.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Creates a shadow style object
 *
 * @param {Object} theme - Theme object from useTheme
 * @param {number} elevation - Shadow elevation (0-24)
 * @returns {Object} Shadow style object
 *
 * @example
 * const shadow = createShadow(theme, 4);
 */
export function createShadow(theme, elevation = 4) {
  if (elevation === 0) {
    return {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  }

  return {
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: Math.floor(elevation / 2),
    },
    shadowOpacity: theme.isDark ? 0.3 : 0.2,
    shadowRadius: elevation,
    elevation,
  };
}

/**
 * Interpolates between two colors based on a value
 * Useful for creating gradients or transitions
 *
 * @param {string} color1 - Start color (hex)
 * @param {string} color2 - End color (hex)
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {string} Interpolated hex color
 */
export function interpolateColor(color1, color2, factor) {
  const c1 = color1.replace("#", "");
  const c2 = color2.replace("#", "");

  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
