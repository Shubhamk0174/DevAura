import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const Login = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const { login, isLoading, error, clearError, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    clearError();
    const result = await login(email, password);

    if (result.success) {
      // Auth state listener will handle navigation automatically
      // No manual redirect needed
    } else if (result.needsVerification) {
      Alert.alert(
        'Email Not Verified',
        'Please verify your email before logging in. Check your inbox for the verification link.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Resend Email', 
            onPress: async () => {
              const resendResult = await resendVerificationEmail();
              if (resendResult.success) {
                Alert.alert('Success', resendResult.message);
              } else {
                Alert.alert('Error', resendResult.error);
              }
            }
          },
        ]
      );
    } else {
      Alert.alert('Login Failed', error || result.error || 'Please try again');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in to your account
        </ThemedText>

        <ThemedView style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.6 }
            ]}
            onPress={handleLogin}
            disabled={isLoading}>
            <ThemedText style={[styles.buttonText, { color: colors.buttonText }]}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Don't have an account?{' '}
          </ThemedText>
          <Link href="/register" style={styles.link}>
            <ThemedText type="link">Sign Up</ThemedText>
          </Link>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    opacity: 0.8,
  },
  link: {
    marginLeft: 4,
  },
});