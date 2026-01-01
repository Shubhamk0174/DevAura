import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const ChangePassword = () => {
  const { colors } = useTheme();
  const { changePassword } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: colors.error };
    if (strength <= 3) return { label: 'Medium', color: colors.warning };
    return { label: 'Strong', color: colors.success };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      const result = await changePassword(formData.currentPassword, formData.newPassword);

      if (result.success) {
        Alert.alert(
          'Success',
          'Your password has been changed successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title">Change Password</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={styles.description}>
            Enter your current password and choose a new one.
          </ThemedText>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Current Password</ThemedText>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: colors.text, 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: errors.currentPassword ? colors.error : 'transparent'
                  }
                ]}
                value={formData.currentPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, currentPassword: text });
                  setErrors({ ...errors, currentPassword: null });
                }}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.currentPassword}
              </ThemedText>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>New Password</ThemedText>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: colors.text, 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: errors.newPassword ? colors.error : 'transparent'
                  }
                ]}
                value={formData.newPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, newPassword: text });
                  setErrors({ ...errors, newPassword: null });
                }}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.newPassword}
              </ThemedText>
            )}
            {passwordStrength && !errors.newPassword && (
              <View style={styles.strengthIndicator}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= (passwordStrength.label === 'Weak' ? 1 : passwordStrength.label === 'Medium' ? 2 : 3)
                              ? passwordStrength.color
                              : colors.border
                        }
                      ]}
                    />
                  ))}
                </View>
                <ThemedText style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirm New Password</ThemedText>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: colors.text, 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: errors.confirmPassword ? colors.error : 'transparent'
                  }
                ]}
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  setErrors({ ...errors, confirmPassword: null });
                }}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.confirmPassword}
              </ThemedText>
            )}
          </View>

          {/* Submit Error */}
          {errors.submit && (
            <View style={[styles.submitError, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <ThemedText style={[styles.submitErrorText, { color: colors.error }]}>
                {errors.submit}
              </ThemedText>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.buttonText} />
                <ThemedText style={[styles.submitButtonText, { color: colors.buttonText }]}>
                  Change Password
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.info} />
            <ThemedText style={styles.infoText}>
              Your password must be at least 6 characters long. For better security, use a mix of letters, numbers, and symbols.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  strengthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submitError: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  submitErrorText: {
    flex: 1,
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
});
