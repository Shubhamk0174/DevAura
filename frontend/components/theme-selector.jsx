import { ThemedText } from "@/components/themed-text";
import { THEME_MODES, useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const ThemeSelector = () => {
  const { colors, themeMode, setThemeMode } = useTheme();

  const themes = [
    {
      mode: THEME_MODES.SYSTEM,
      label: "System",
      icon: "phone-portrait-outline",
    },
    {
      mode: THEME_MODES.LIGHT,
      label: "Light",
      icon: "sunny-outline",
    },
    {
      mode: THEME_MODES.DARK,
      label: "Dark",
      icon: "moon-outline",
    },
  ];

  return (
    <View style={styles.container}>
      {themes.map((theme) => {
        const isActive = themeMode === theme.mode;

        return (
          <TouchableOpacity
            key={theme.mode}
            style={[
              styles.option,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : colors.backgroundSecondary,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setThemeMode(theme.mode)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isActive
                    ? colors.primary + "20"
                    : "transparent",
                },
              ]}
            >
              <Ionicons
                name={theme.icon}
                size={24}
                color={isActive ? colors.buttonText : colors.text}
              />
            </View>
            <ThemedText
              style={[
                styles.label,
                { color: isActive ? colors.buttonText : colors.text },
              ]}
            >
              {theme.label}
            </ThemedText>
            {isActive && (
              <View style={styles.checkmark}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.buttonText}
                />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ThemeSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
