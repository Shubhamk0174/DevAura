import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { StyleSheet } from 'react-native';

const Chat = () => {
  const { colors, spacing } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Chat
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Connect with others
      </ThemedText>
    </ThemedView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
});