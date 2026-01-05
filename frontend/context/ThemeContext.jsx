/**
 * Theme Context Provider
 * Manages theme state and provides theme values throughout the app
 * Supports manual theme selection: system, light, dark
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import {
  borderRadius,
  darkTheme,
  fonts,
  fontSizes,
  fontWeights,
  lightTheme,
  lineHeights,
  spacing,
} from "../utils/theme";

const ThemeContext = createContext(undefined);

const THEME_PREFERENCE_KEY = "theme_preference";

// Theme mode options: 'system', 'light', 'dark'
export const THEME_MODES = {
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
};

export function ThemeProvider({ children }) {
  // Get system color scheme (light/dark)
  const systemColorScheme = useSystemColorScheme();

  // User's theme preference
  const [themeMode, setThemeModeState] = useState(THEME_MODES.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themeMode === THEME_MODES.SYSTEM) {
      return systemColorScheme === "dark";
    }
    return themeMode === THEME_MODES.DARK;
  }, [themeMode, systemColorScheme]);

  // Function to change theme
  const setThemeMode = async (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.error("Invalid theme mode:", mode);
      return;
    }

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

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
      themeMode,
      setThemeMode,
    }),
    [isDark, themeMode]
  );

  // Show nothing while loading theme preference
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Custom hook to access theme
 * @returns {Object} Theme object containing colors, fonts, spacing, etc.
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
