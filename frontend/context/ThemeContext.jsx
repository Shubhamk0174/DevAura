/**
 * Theme Context Provider
 * Manages theme state and provides theme values throughout the app
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import {
  darkTheme,
  lightTheme,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadius
} from '../utils/theme';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  // Get system color scheme (light/dark)
  const systemColorScheme = useSystemColorScheme();
  const isDark = systemColorScheme === 'dark';

  // Memoize theme object to prevent unnecessary re-renders
  const theme = useMemo(
    () => ({
      colors: isDark ? darkTheme : lightTheme,
      fonts,
      fontSizes,
      fontWeights,
      lineHeights,
      spacing,
      borderRadius,
      isDark,
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Custom hook to access theme
 * @returns {Object} Theme object containing colors, fonts, spacing, etc.
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
