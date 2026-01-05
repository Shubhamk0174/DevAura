import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StyleSheet } from "react-native";
import { useEffect } from "react";

// Inner component that has access to theme context
function AppContent() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Create custom navigation theme with our colors
  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.backgroundSecondary,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.backgroundSecondary,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      // If user is signed in and trying to access auth pages, redirect to home
      router.replace("/(tabs)/home");
    } else if (!isAuthenticated && !inAuthGroup) {
      // If user is not signed in and trying to access protected pages, redirect to login
      // Check if we're not already in the auth group to avoid loops
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <NavigationThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modals)/change-password"
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen
            name="(modals)/edit-public-profile"
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen
            name="(modals)/view-profile"
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen
            name="(modals)/chat-room"
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack>
        {/* Status bar style: light text for dark mode, dark text for light mode */}
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationThemeProvider>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
