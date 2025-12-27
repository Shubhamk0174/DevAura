import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const Profile = () => {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Edit profile functionality will be available soon!');
  };

  const handleSettings = () => {
    Alert.alert('Coming Soon', 'Settings will be available soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'For support, please contact: support@example.com');
  };

  const ProfileItem = ({ icon, label, value, onPress, showChevron = false }) => (
    <TouchableOpacity 
      style={[styles.profileItem, { backgroundColor: colors.backgroundSecondary }]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <ThemedText style={styles.itemLabel}>{label}</ThemedText>
          {value && <ThemedText style={styles.itemValue}>{value}</ThemedText>}
        </View>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.userName}>
            {user?.name || 'User'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user?.email || 'email@example.com'}
          </ThemedText>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <ThemedText style={[styles.verifiedText, { color: colors.success }]}>
              Verified Account
            </ThemedText>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <ProfileItem 
            icon="person-outline" 
            label="Edit Profile" 
            onPress={handleEditProfile}
            showChevron 
          />
          <ProfileItem 
            icon="mail-outline" 
            label="Email" 
            value={user?.email || 'Not available'} 
          />
          <ProfileItem 
            icon="key-outline" 
            label="Change Password" 
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon!')}
            showChevron 
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          <ProfileItem 
            icon="settings-outline" 
            label="Settings" 
            onPress={handleSettings}
            showChevron 
          />
          <ProfileItem 
            icon="notifications-outline" 
            label="Notifications" 
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
            showChevron 
          />
          <ProfileItem 
            icon="moon-outline" 
            label="Dark Mode" 
            value="Auto" 
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
          <ProfileItem 
            icon="help-circle-outline" 
            label="Help & Support" 
            onPress={handleHelp}
            showChevron 
          />
          <ProfileItem 
            icon="information-circle-outline" 
            label="About" 
            onPress={() => Alert.alert('About', 'Version 1.0.0')}
            showChevron 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.buttonText} />
          <ThemedText style={[styles.logoutText, { color: colors.buttonText }]}>
            Logout
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            TechSprint © 2025
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.6,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.4,
  },
});